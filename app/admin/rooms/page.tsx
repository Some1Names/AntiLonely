import { Suspense } from "react";
import { connection } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminRooms from "@/component/admin/AdminRooms";

export default function AdminRoomsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-ink-soft">กำลังโหลดห้องแชท...</div>
      }
    >
      <AdminRoomsData />
    </Suspense>
  );
}

async function AdminRoomsData() {
  await connection();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user.role;

  if (!session) {
    return (
      <div className="rounded-xl border bg-white p-8">
        <h1 className="text-xl font-semibold">ไม่พบ Session</h1>
        <p className="mt-2 text-sm text-ink-soft">
          กรุณาเข้าสู่ระบบก่อนใช้งานหน้าจัดการห้องแชท
        </p>
      </div>
    );
  }

  if (role !== "admin" && role !== "moderator") {
    return (
      <div className="rounded-xl border bg-white p-8">
        <h1 className="text-xl font-semibold">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-2 text-sm text-ink-soft">
          หน้านี้สำหรับ Admin และ Moderator เท่านั้น
        </p>
      </div>
    );
  }

  const rooms = await prisma.room.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      passwordHash: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });

  const roomIds = rooms.map((room) => room.id);

  const [memberCounts, postCounts] =
    roomIds.length > 0
      ? await Promise.all([
          prisma.roomMember.groupBy({
            by: ["roomId"],
            where: {
              roomId: { in: roomIds },
              status: "active",
            },
            _count: {
              _all: true,
            },
          }),
          prisma.message.groupBy({
            by: ["roomId"],
            where: {
              roomId: { in: roomIds },
              parentId: null,
              status: "visible",
            },
            _count: {
              _all: true,
            },
          }),
        ])
      : [[], []];

  const memberCountMap = new Map(
    memberCounts.map((item) => [item.roomId, item._count._all])
  );

  const postCountMap = new Map(
    postCounts.map((item) => [item.roomId, item._count._all])
  );

  const roomRows = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    description: room.description,
    type: room.passwordHash ? "private" as const : "public" as const,
    status: room.status,
    createdAt: room.createdAt.toISOString(),
    members: memberCountMap.get(room.id) ?? 0,
    posts: postCountMap.get(room.id) ?? 0,
  }));

  const summary = {
    total: rooms.length,
    public: rooms.filter((room) => !room.passwordHash).length,
    private: rooms.filter((room) => !!room.passwordHash).length,
    archived: rooms.filter((room) => room.status === "archived").length,
  };

  return <AdminRooms rooms={roomRows} summary={summary} />;
}
