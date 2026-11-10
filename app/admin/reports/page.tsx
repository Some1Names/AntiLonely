import { connection } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminReports from "@/component/admin/AdminReports";

export default async function AdminReportsPage() {
  // รอ Request จริงก่อนดึงข้อมูลและใช้เวลาปัจจุบัน
  await connection();

  // 1. ตรวจสอบสิทธิ์
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user.role;
  if (!session) {
  return (
    <div className="rounded-xl border border-red-200 bg-white p-8">
      <h1 className="text-xl font-bold text-red-600">
        ไม่พบ Session
      </h1>
      <p className="mt-2 text-gray-600">
        ระบบไม่พบข้อมูลการเข้าสู่ระบบ กรุณาตรวจสอบการ Login อีกครั้ง
      </p>
    </div>
  );
}

if (role !== "admin" && role !== "moderator") {
  return (
    <div className="rounded-xl border border-red-200 bg-white p-8">
      <h1 className="text-xl font-bold text-red-600">
        ไม่มีสิทธิ์เข้าถึงหน้านี้
      </h1>
      <p className="mt-2 text-gray-600">
        Role ปัจจุบันของบัญชี: {role ?? "ไม่พบ Role"}
      </p>
      <p className="mt-2 text-sm text-gray-500">
        ต้องเป็น admin หรือ moderator จึงจะเข้าหน้าจัดการรายงานได้
      </p>
    </div>
  );
}

  // 2. ดึงรายงานจาก Database
  const reports = await prisma.report.findMany({
    include: {
      message: {
        include: {
          room: {
            select: {
              name: true,
            },
          },
          author: {
            select: {
              username: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 3. รวมรายงานที่เกี่ยวข้องกับข้อความเดียวกัน
  // เพื่อให้ข้อความหนึ่งแสดงเป็นหนึ่งแถวในตาราง
  const groupedReports = new Map<
    string,
    {
      messageId: string;
      content: string;
      room: string;
      author: string;
      reason: string;
      count: number;
      status: string;
      createdAt: Date;
      reasonCounts: Map<string, number>;
    }
  >();

  for (const report of reports) {
    const message = report.message;
    const messageId = report.messageId;

    const existing = groupedReports.get(messageId);

    if (existing) {
      existing.count += 1;

      const currentReasonCount =
        existing.reasonCounts.get(report.reason) ?? 0;

      existing.reasonCounts.set(
        report.reason,
        currentReasonCount + 1,
      );

      // ใช้เวลารายงานล่าสุด
      if (report.createdAt > existing.createdAt) {
        existing.createdAt = report.createdAt;
      }
    } else {
      groupedReports.set(messageId, {
        messageId,
        content: message.content,
        room: message.room.name,
        author: message.author?.username ?? "ไม่ทราบผู้เขียน",
        reason: report.reason,
        count: 1,
        status: report.status,
        createdAt: report.createdAt,
        reasonCounts: new Map([[report.reason, 1]]),
      });
    }
  }

  // 4. แปลงข้อมูลให้อยู่ในรูปแบบที่ส่งให้ Client Component ได้
  const reportRows = Array.from(groupedReports.values()).map(
    (item) => {
      // เลือกเหตุผลที่มีผู้รายงานมากที่สุด
      const mainReason = Array.from(item.reasonCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? item.reason;

      return {
        messageId: item.messageId,
        content: item.content,
        room: item.room,
        author: item.author,
        reason: mainReason,
        count: item.count,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      };
    },
  );

  // 5. ส่งข้อมูลไปแสดงผล
  return <AdminReports reports={reportRows} />;
}