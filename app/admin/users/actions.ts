"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return session.user.id;
}

// เปลี่ยนสถานะผู้ใช้ใน Database
export async function updateUsersStatus(
  userIds: string[],
  status: UserStatus,
) {
  const adminId = await checkAdminPermission();

  if (userIds.length === 0) {
    throw new Error("กรุณาเลือกผู้ใช้");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // ปลดระงับ / ปลดแบน
    if (status === "active") {
      await tx.sanction.updateMany({
        where: {
          userId: { in: userIds },
          type: { in: ["suspension", "ban"] },
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
            issuedById: adminId,
          },
        });
      }
    }
  });

  return { success: true };
}
