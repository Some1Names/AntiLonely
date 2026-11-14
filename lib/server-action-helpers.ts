import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isUuid } from '@/lib/room-board';
import type { ReportReason } from '@/types/post-thread';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const VALID_REPORT_REASONS = new Set<ReportReason>([
  'inappropriate',
  'spam',
  'misinformation',
  'other',
]);

export function formatReportReason(
  reason: ReportReason,
  details?: string
): string {
  const trimmedDetails = details?.trim();
  return trimmedDetails ? `${reason}: ${trimmedDetails.slice(0, 500)}` : reason;
}

export async function runSafeMutation<T>(
  fn: () => Promise<ActionResult<T>>,
  fallbackError: string
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch {
    return { ok: false, error: fallbackError };
  }
}

export async function getViewerUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;
    if (!userId || !isUuid(userId)) return null;

    const now = new Date();
    const [user, activeSanction] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayUsername: true,
          name: true,
        },
      }),
      prisma.sanction.findFirst({
        where: {
          userId,
          type: { in: ['suspension', 'ban'] },
          liftedAt: null,
          OR: [{ endAt: null }, { endAt: { gt: now } }],
        },
        select: { id: true },
      }),
    ]);

    if (!user || activeSanction) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
