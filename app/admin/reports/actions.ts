
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ReportActionResult =
  | { ok: true; affected: number }
  | { ok: false; error: string };

// ตรวจสอบสิทธิ์ผู้ใช้งาน
async function checkReportPermission(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user.role;

  if (!session || (role !== "admin" && role !== "moderator")) {
    return {
      ok: false,
      error: "คุณไม่มีสิทธิ์จัดการรายงาน",
    };
  }

  return { ok: true };
}

// ตรวจสอบ message IDs
function validateMessageIds(messageIds: string[]) {
  return (
    Array.isArray(messageIds) &&
    messageIds.length > 0 &&
    messageIds.length <= 100 &&
    messageIds.every(
      (id) => typeof id === "string" && id.trim().length > 0,
    )
  );
}

// ยกเลิกรายงานที่เลือก
export async function dismissReports(
  messageIds: string[],
): Promise<ReportActionResult> {
  const permission = await checkReportPermission();

  if (!permission.ok) return permission;

  if (!validateMessageIds(messageIds)) {
    return { ok: false, error: "รายการที่เลือกไม่ถูกต้อง" };
  }

  // ค้นหาเฉพาะข้อความที่มีรายงานรอดำเนินการ
  const pendingReports = await prisma.report.findMany({
    where: {
      messageId: { in: messageIds },
      status: "pending",
    },
    select: {
      messageId: true,
    },
    distinct: ["messageId"],
  });

  const validMessageIds = pendingReports.map(
    (report) => report.messageId,
  );

  if (validMessageIds.length === 0) {
    return {
      ok: false,
      error: "ไม่พบรายงานที่รอดำเนินการในรายการที่เลือก",
    };
  }

  const result = await prisma.report.updateMany({
    where: {
      messageId: { in: validMessageIds },
      status: "pending",
    },
    data: {
      status: "dismissed",
    },
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");

  return {
    ok: true,
    affected: result.count,
  };
}

// ลบเนื้อหาที่ถูกรายงาน (Soft Delete)
export async function deleteReportedMessages(
  messageIds: string[],
): Promise<ReportActionResult> {
  const permission = await checkReportPermission();

  if (!permission.ok) return permission;

  if (!validateMessageIds(messageIds)) {
    return { ok: false, error: "รายการที่เลือกไม่ถูกต้อง" };
  }

  // ตรวจสอบว่าข้อความที่เลือกมีรายงานรอดำเนินการจริง
  const pendingReports = await prisma.report.findMany({
    where: {
      messageId: { in: messageIds },
      status: "pending",
    },
    select: {
      messageId: true,
    },
    distinct: ["messageId"],
  });

  const validMessageIds = pendingReports.map(
    (report) => report.messageId,
  );

  if (validMessageIds.length === 0) {
    return {
      ok: false,
      error: "ไม่พบรายงานที่รอดำเนินการในรายการที่เลือก",
    };
  }

  // อัปเดตข้อความและรายงานใน Transaction เดียวกัน
  const [, reportResult] = await prisma.$transaction([
    prisma.message.updateMany({
      where: {
        id: { in: validMessageIds },
      },
      data: {
        status: "deleted",
      },
    }),

    prisma.report.updateMany({
      where: {
        messageId: { in: validMessageIds },
        status: "pending",
      },
      data: {
        status: "resolved",
      },
    }),
  ]);

  revalidatePath("/admin/reports");
  revalidatePath("/admin");

  return {
    ok: true,
    affected: reportResult.count,
  };
}
