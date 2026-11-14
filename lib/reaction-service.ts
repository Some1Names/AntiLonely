import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isMessageInPostSubtree } from '@/lib/post-thread-mapper';
import {
  applyReactionWithStore,
  resolveThreadAncestryStatus,
} from '@/lib/reaction-helpers';
import {
  aggregateReactions,
  canMemberReactInRoom,
  isUuid,
} from '@/lib/room-board';
import type { ReactionItem } from '@/types/post-thread';

export type ToggleReactionServiceResult =
  | {
      ok: true;
      status: 200;
      data: {
        messageId: string;
        postId: string;
        roomId: string;
        roomSlug: string;
        emoji: string;
        reactions: ReactionItem[];
      };
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

function normalizeUuid(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return isUuid(trimmed) ? trimmed : null;
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

/**
 * Validates auth, room membership, and subtree ancestry in one parallel batch,
 * then toggles the reaction without holding an interactive DB transaction.
 */
export async function toggleMessageReaction(input: {
  roomId: string;
  postId?: string;
  messageId: string;
  emoji: string;
  active?: boolean;
  headers?: Headers;
}): Promise<ToggleReactionServiceResult> {
  const isThreadMode = input.postId !== undefined;
  const notFoundError = isThreadMode
    ? 'ไม่พบข้อความที่ต้องการกดรีแอคชัน'
    : 'ไม่พบกระทู้ที่ต้องการรีแอคชัน';

  const emoji = typeof input.emoji === 'string' ? input.emoji.trim() : '';
  if (!emoji || emoji.length > 32) {
    return { ok: false, status: 400, error: 'อีโมจิไม่ถูกต้อง' };
  }

  const roomId = normalizeUuid(input.roomId);
  const messageId = normalizeUuid(input.messageId);
  const postId = isThreadMode ? normalizeUuid(input.postId) : messageId;

  if (!roomId || !messageId || !postId) {
    return { ok: false, status: 404, error: notFoundError };
  }

  const requestHeaders = input.headers ?? (await headers());
  const session = await auth.api.getSession({ headers: requestHeaders });
  const userId = session?.user?.id;
  if (!userId || !isUuid(userId)) {
    return { ok: false, status: 401, error: 'กรุณาเข้าสู่ระบบก่อนกดรีแอคชัน' };
  }

  const now = new Date();
  const [activeSanction, room, member, rootPost, target] = await Promise.all([
    prisma.sanction.findFirst({
      where: {
        userId,
        type: { in: ['suspension', 'ban'] },
        liftedAt: null,
        OR: [{ endAt: null }, { endAt: { gt: now } }],
      },
      select: { id: true },
    }),
    prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, slug: true, status: true, passwordHash: true },
    }),
    prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: { status: true },
    }),
    isThreadMode && postId !== messageId
      ? prisma.message.findFirst({
          where: { id: postId, roomId, parentId: null, status: 'visible' },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.message.findFirst({
      where: { id: messageId, roomId, status: 'visible' },
      select: {
        id: true,
        roomId: true,
        parentId: true,
        status: true,
        parent: {
          select: {
            id: true,
            roomId: true,
            parentId: true,
            status: true,
            parent: {
              select: {
                id: true,
                roomId: true,
                parentId: true,
                status: true,
                parent: {
                  select: {
                    id: true,
                    roomId: true,
                    parentId: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (activeSanction) {
    return { ok: false, status: 401, error: 'กรุณาเข้าสู่ระบบก่อนกดรีแอคชัน' };
  }

  if (!room || room.status !== 'active' || !target) {
    return { ok: false, status: 404, error: notFoundError };
  }

  if (!isThreadMode) {
    if (target.parentId !== null) {
      return { ok: false, status: 404, error: notFoundError };
    }
  } else {
    const hasActiveRootPost =
      postId === messageId ? target.parentId === null : Boolean(rootPost);
    const ancestry = resolveThreadAncestryStatus({
      postId,
      target,
      hasActiveRootPost,
    });

    if (ancestry === 'not_found') {
      return { ok: false, status: 404, error: notFoundError };
    }

    if (ancestry === 'needs_fallback') {
      const visibleMessages = await prisma.message.findMany({
        where: {
          roomId: room.id,
          parentId: { not: null },
          status: 'visible',
        },
        select: {
          id: true,
          parentId: true,
          status: true,
        },
      });
      if (!isMessageInPostSubtree(postId, messageId, visibleMessages)) {
        return { ok: false, status: 404, error: notFoundError };
      }
    }
  }

  const reactPermission = canMemberReactInRoom({
    isPrivate: Boolean(room.passwordHash),
    memberStatus: member?.status,
  });
  if (!reactPermission.ok) {
    return { ok: false, status: 403, error: reactPermission.error };
  }

  const updatedRows = await applyReactionWithStore({
    desiredActive: input.active,
    deleteMany: () =>
      prisma.reaction.deleteMany({
        where: {
          messageId: target.id,
          userId,
          emojiType: emoji,
        },
      }),
    create: () =>
      prisma.reaction.create({
        data: {
          messageId: target.id,
          userId,
          emojiType: emoji,
        },
      }),
    findMany: () =>
      prisma.reaction.findMany({
        where: { messageId: target.id },
        orderBy: { createdAt: 'asc' },
        select: {
          emojiType: true,
          userId: true,
        },
      }),
    isUniqueViolation: isPrismaUniqueConstraintError,
  });

  return {
    ok: true,
    status: 200,
    data: {
      messageId: target.id,
      postId,
      roomId: room.id,
      roomSlug: room.slug,
      emoji,
      reactions: aggregateReactions(updatedRows, userId),
    },
  };
}
