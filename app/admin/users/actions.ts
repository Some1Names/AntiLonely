"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDuration, SUSPENSION_PRESET_DAYS } from "@/lib/sanctions";

type UserStatus = "active" | "suspended" | "banned";

// ตรวจสอบสิทธิ์ก่อนจัดการข้อมูลทุกครั้ง
async function checkAdminPermission() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("กรุณาเข้าสู่ระบบก่อน");
  }

  const role = session.user.role;

  if (role !== "admin" && role !== "moderator") {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการนี้");
  }

  return { id: session.user.id, role };
}

type UserRole = "user" | "moderator" | "admin";

// เปลี่ยน role ของผู้ใช้ (เฉพาะ admin เท่านั้น)
export async function updateUserRole(userId: string, role: UserRole) {
  const actor = await checkAdminPermission();

  if (actor.role !== "admin") {
    throw new Error("เฉพาะ admin เท่านั้นที่เปลี่ยน role ได้");
  }

  if (!["user", "moderator", "admin"].includes(role)) {
    throw new Error("role ไม่ถูกต้อง");
  }

  if (userId === actor.id) {
    throw new Error("ไม่สามารถเปลี่ยน role ของตัวเองได้");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return { success: true };
}

// เปลี่ยนสถานะผู้ใช้ใน Database
export async function updateUsersStatus(
  rawUserIds: string[],
  status: UserStatus,
) {
  const { id: adminId, role: actorRole } = await checkAdminPermission();

  // Server Action เรียกตรงได้ จึงไม่เชื่อ type จาก TypeScript
  if (
    !Array.isArray(rawUserIds) ||
    rawUserIds.length === 0 ||
    rawUserIds.length > 100 ||
    rawUserIds.some((id) => typeof id !== "string" || id.length === 0)
  ) {
    throw new Error("กรุณาเลือกผู้ใช้ (สูงสุด 100 บัญชี)");
  }

  if (!["active", "suspended", "banned"].includes(status)) {
    throw new Error("สถานะไม่ถูกต้อง");
  }

  const userIds = [...new Set(rawUserIds)];

  // เฉพาะ admin เท่านั้นที่แบนได้
  if (status === "banned" && actorRole !== "admin") {
    throw new Error("เฉพาะ admin เท่านั้นที่แบนผู้ใช้ได้");
  }

  // ระงับ / แบน: ห้ามทำกับตัวเอง, admin หรือผู้ใช้ที่ไม่มีอยู่จริง
  if (status !== "active") {
    if (userIds.includes(adminId)) {
      throw new Error("ไม่สามารถระงับหรือแบนตัวเองได้");
    }

    const targets = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true },
    });

    if (targets.length !== userIds.length) {
      throw new Error("ไม่พบผู้ใช้บางรายที่เลือก");
    }

    if (targets.some((t) => t.role === "admin")) {
      throw new Error("ไม่สามารถระงับหรือแบน admin ได้");
    }
  }

  const now = new Date();

  // moderator กดปลดแบน: แจ้ง error แทนที่จะทำเหมือนสำเร็จโดยไม่มีอะไรเปลี่ยน
  if (status === "active" && actorRole !== "admin") {
    const activeBans = await prisma.sanction.count({
      where: {
        userId: { in: userIds },
        type: "ban",
        liftedAt: null,
      },
    });

    if (activeBans > 0) {
      throw new Error("เฉพาะ admin เท่านั้นที่ปลดแบนได้");
    }
  }

  await prisma.$transaction(async (tx) => {
    // ปลดระงับ / ปลดแบน (moderator ปลดได้เฉพาะการระงับ)
    if (status === "active") {
      await tx.sanction.updateMany({
        where: {
          userId: { in: userIds },
          type:
            actorRole === "admin"
              ? { in: ["suspension", "ban"] }
              : "suspension",
          liftedAt: null,
        },
        data: {
          liftedAt: now,
        },
      });

      return;
    }

    // ระงับ / แบน
    const sanctionType =
      status === "suspended" ? "suspension" : "ban";

    // ระงับมีกำหนดเวลา, แบนไม่มีวันสิ้นสุด
    const endAt =
      sanctionType === "suspension"
        ? addDuration(now, SUSPENSION_PRESET_DAYS[0], "day")
        : null;

    for (const userId of userIds) {
      // ตรวจสอบว่ามีสถานะนี้อยู่แล้วหรือไม่
      const existing = await tx.sanction.findFirst({
        where: {
          userId,
          type: sanctionType,
          liftedAt: null,
          OR: [
            { endAt: null },
            { endAt: { gt: now } },
          ],
        },
      });

      // ถ้ายังไม่มี ให้สร้างประวัติการลงโทษใหม่
      if (!existing) {
        await tx.sanction.create({
          data: {
            userId,
            type: sanctionType,
            reason: "ดำเนินการผ่านหน้า Admin Users",
            startAt: now,
            endAt,
            issuedById: adminId,
          },
        });
      }
    }

    // เตะผู้ใช้ออกจากระบบทันที
    await tx.session.deleteMany({
      where: { userId: { in: userIds } },
    });
  });

  return { success: true };
}
