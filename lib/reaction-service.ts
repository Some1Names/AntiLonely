import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  executeToggleMessageReaction,
  type ToggleReactionServiceResult,
} from '@/lib/reaction-helpers';

export type { ToggleReactionServiceResult };

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
  return executeToggleMessageReaction(input, {
    getSessionUserId: async (providedHeaders) => {
      const requestHeaders = providedHeaders ?? (await headers());
      const session = await auth.api.getSession({ headers: requestHeaders });
      return session?.user?.id;
    },
    loadContext: async ({ userId, roomId, postId, messageId, isThreadMode }) => {
      const now = new Date();
      const [activeSanction, room, member, rootPost, target] =
        await Promise.all([
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

      return {
        hasActiveSanction: Boolean(activeSanction),
        room: room
          ? {
              id: room.id,
              slug: room.slug,
              status: room.status,
              isPrivate: Boolean(room.passwordHash),
            }
          : null,
        memberStatus: member?.status ?? null,
        hasActiveRootPost: Boolean(rootPost),
        target,
      };
    },
    loadVisibleRoomReplies: (roomId) =>
      prisma.message.findMany({
        where: {
          roomId,
          parentId: { not: null },
          status: 'visible',
        },
        select: {
          id: true,
          parentId: true,
          status: true,
        },
      }),
    createStoreForMessage: ({ messageId, userId, emoji }) => ({
      deleteMany: () =>
        prisma.reaction.deleteMany({
          where: {
            messageId,
            userId,
            emojiType: emoji,
          },
        }),
      create: () =>
        prisma.reaction.create({
          data: {
            messageId,
            userId,
            emojiType: emoji,
          },
        }),
      findMany: () =>
        prisma.reaction.findMany({
          where: { messageId },
          orderBy: { createdAt: 'asc' },
          select: {
            emojiType: true,
            userId: true,
          },
        }),
      isUniqueViolation: isPrismaUniqueConstraintError,
    }),
  });
}
