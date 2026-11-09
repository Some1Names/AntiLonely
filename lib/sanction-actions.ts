"use server";

import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { suspensionEndsWithinLimit } from "./sanctions";

export type SanctionResult = { ok: true } | { ok: false; error: string };

const MAX_REASON_LENGTH = 1000;

// Who may do what: moderators and admins can suspend; only admins can ban.
// Nobody can sanction themselves or an admin.
async function checkPermission(
  targetUserId: string,
  action: "suspend" | "ban",
): Promise<{ ok: true; issuedById: string } | { ok: false; error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user.role;
  if (!session || (role !== "admin" && (action === "ban" || role !== "moderator"))) {
    return { ok: false, error: "คุณไม่มีสิทธิ์ทำรายการนี้" };
  }
  if (session.user.id === targetUserId) return { ok: false, error: "ระงับหรือแบนบัญชีตัวเองไม่ได้" };

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
  if (!target) return { ok: false, error: "ไม่พบผู้ใช้นี้" };
  if (target.role === "admin") return { ok: false, error: "ระงับหรือแบนผู้ดูแลระบบไม่ได้" };
  return { ok: true, issuedById: session.user.id };
}

export async function suspendUser(input: {
  userId: string;
  // ISO date-time when the user gets access back.
  endAt: string;
  reason: string;
  notifyByEmail: boolean;
}): Promise<SanctionResult> {
  const endAt = new Date(input.endAt);
  if (Number.isNaN(endAt.getTime()) || !suspensionEndsWithinLimit(endAt)) {
    return { ok: false, error: "วันสิ้นสุดการระงับไม่ถูกต้อง" };
  }
  const reason = input.reason.trim().slice(0, MAX_REASON_LENGTH);

  const permission = await checkPermission(input.userId, "suspend");
  if (!permission.ok) return permission;

  await prisma.$transaction([
    prisma.sanction.create({
      data: { type: "suspension", reason, endAt, userId: input.userId, issuedById: permission.issuedById },
    }),
    // Log them out everywhere; the session hook in lib/auth.ts stops new logins.
    prisma.session.deleteMany({ where: { userId: input.userId } }),
  ]);
  // TODO: send the email when an email service is set up (input.notifyByEmail).
  return { ok: true };
}

export async function banUser(input: {
  userId: string;
  reason: string;
  deletePosts: boolean;
  notifyByEmail: boolean;
}): Promise<SanctionResult> {
  const reason = input.reason.trim().slice(0, MAX_REASON_LENGTH);
  if (!reason) return { ok: false, error: "ต้องระบุเหตุผลในการแบน" };

  const permission = await checkPermission(input.userId, "ban");
  if (!permission.ok) return permission;

  await prisma.$transaction([
    prisma.sanction.create({
      data: { type: "ban", reason, endAt: null, userId: input.userId, issuedById: permission.issuedById },
    }),
    prisma.session.deleteMany({ where: { userId: input.userId } }),
    // Soft delete: posts stay in the database (for reports and appeals) but
    // are hidden from everyone.
    ...(input.deletePosts
      ? [prisma.message.updateMany({ where: { authorId: input.userId }, data: { status: "deleted" } })]
      : []),
  ]);
  // TODO: send the email when an email service is set up (input.notifyByEmail).
  return { ok: true };
}
