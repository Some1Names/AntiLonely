import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import AdminUsersClient from "./AdminUsersClient";

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-ink-soft">กำลังโหลดผู้ใช้...</div>
      }
    >
      <AdminUsersData />
    </Suspense>
  );
}

async function AdminUsersData() {
  await connection();

  const now = new Date();

  // ดึงข้อมูลผู้ใช้จาก Database
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      username: true,
      displayUsername: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,

      // ดึงประวัติการระงับและแบนที่ยังมีผล
      sanctionsReceived: {
        where: {
          type: {
            in: ["suspension", "ban"],
          },
          liftedAt: null,
          OR: [
            { endAt: null },
            { endAt: { gt: now } },
          ],
        },
        select: {
          type: true,
        },
      },

      // นับจำนวนโพสต์หลักที่ยังมองเห็นได้
      _count: {
        select: {
          messages: {
            where: {
              parentId: null,
              status: "visible",
            },
          },
        },
      },
    },
  });

  // แปลงข้อมูลจาก Prisma ให้ตรงกับรูปแบบที่หน้าเว็บใช้
  const initialUsers = users.map((user) => {
    const hasBan = user.sanctionsReceived.some(
      (sanction) => sanction.type === "ban",
    );

    const hasSuspension = user.sanctionsReceived.some(
      (sanction) => sanction.type === "suspension",
    );

    let status: "active" | "suspended" | "banned" = "active";

    if (hasBan) {
      status = "banned";
    } else if (hasSuspension) {
      status = "suspended";
    }

    return {
      id: user.id,
      name: user.displayUsername || user.username,
      email: user.email,
      role: user.role,
      joinedAt: user.createdAt.toISOString(),
      lastActiveAt: null,
      posts: user._count.messages,
      status,
    };
  });

  return <AdminUsersClient initialUsers={initialUsers} />;
}
