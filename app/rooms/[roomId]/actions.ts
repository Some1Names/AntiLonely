'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  formatReportReason,
  getViewerUser,
  runSafeMutation,
  VALID_REPORT_REASONS,
  type ActionResult,
} from '@/lib/server-action-helpers';
import type { MyRoom, Room } from '@/types/room';
import {
  aggregateReactions,
  canMemberEditPostInRoom,
  canMemberPostInRoom,
  canMemberReactInRoom,
  DEFAULT_ROOM_EMOJI,
  isUuid,
  mapDbMembershipToBoardState,
  mapDbPostToBoardPost,
  mapDbRoomToBoardRoom,
  resolveAuthorAlias,
  resolveRoomLookupTarget,
  validatePostContent,
} from '@/lib/room-board';
import type {
  BoardPostSummary,
  ReactionItem,
  ReportReason,
  RoomBoardMembershipState,
} from '@/types/post-thread';

export type { ActionResult };

export interface RoomBoardViewer {
  id: string;
  name: string;
  alias: string;
  notifications: number;
}

export interface RoomBoardData {
  room: Room & {
    slug: string;
    totalPosts: number;
    rulesList: string[];
    isLocked: boolean;
  };
  membership: RoomBoardMembershipState;
  initialPosts: BoardPostSummary[];
  currentUser: RoomBoardViewer | null;
  myRooms: MyRoom[];
  serverTime: string;
}

function revalidateRoomPaths(roomId: string, roomSlug?: string | null) {
  if (roomSlug) {
    revalidatePath(`/rooms/${roomSlug}`);
  }
  revalidatePath(`/rooms/${roomId}`);
}

export async function getRoomBoardData(
  roomIdOrSlug: string
): Promise<RoomBoardData | null> {
  const target = resolveRoomLookupTarget(roomIdOrSlug);
  if (!target) {
    return null;
  }

  const now = new Date();
  const nowMs = now.getTime();

  const [roomRecord, viewer] = await Promise.all([
    prisma.room.findUnique({
      where: target.kind === 'id' ? { id: target.id } : { slug: target.slug },
      include: {
        _count: {
          select: {
            members: {
              where: { status: 'active' },
            },
          },
        },
      },
    }),
    getViewerUser(),
  ]);

  if (!roomRecord || roomRecord.status !== 'active') {
    return null;
  }

  const canonicalRoomId = roomRecord.id;

  const [
    viewerMembership,
    messageRows,
    myMemberships,
    unreadNotifications,
  ] = await Promise.all([
    viewer
      ? prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: viewer.id,
              roomId: canonicalRoomId,
            },
          },
          select: { status: true },
        })
      : Promise.resolve(null),
    prisma.message.findMany({
      where: {
        roomId: canonicalRoomId,
        parentId: null,
        status: 'visible',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayUsername: true,
            name: true,
          },
        },
        reactions: {
          orderBy: { createdAt: 'asc' },
          select: {
            emojiType: true,
            userId: true,
          },
        },
        _count: {
          select: {
            replies: {
              where: { status: 'visible' },
            },
          },
        },
      },
    }),
    viewer
      ? prisma.roomMember.findMany({
          where: {
            userId: viewer.id,
            status: 'active',
            room: { status: 'active' },
          },
          orderBy: { joinedAt: 'desc' },
          include: {
            room: {
              select: {
                id: true,
                slug: true,
                name: true,
                passwordHash: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    viewer
      ? prisma.notification.count({
          where: {
            userId: viewer.id,
            isRead: false,
          },
        })
      : Promise.resolve(0),
  ]);

  const mappedRoom = mapDbRoomToBoardRoom(
    {
      id: roomRecord.id,
      slug: roomRecord.slug,
      name: roomRecord.name,
      description: roomRecord.description,
      rules: roomRecord.rules,
      passwordHash: roomRecord.passwordHash,
      isLocked: roomRecord.isLocked,
      createdAt: roomRecord.createdAt,
      memberCount: roomRecord._count.members,
      postsToday: 0,
      totalPosts: 0,
    },
    nowMs
  );

  const membership = mapDbMembershipToBoardState(
    roomRecord._count.members,
    viewerMembership?.status ?? null
  );

  const initialPosts: BoardPostSummary[] = messageRows.map((msg) =>
    mapDbPostToBoardPost(
      {
        id: msg.id,
        roomId: msg.roomId,
        content: msg.content,
        createdAt: msg.createdAt,
        authorId: msg.authorId,
        author: msg.author,
        reactions: msg.reactions,
        replyCount: msg._count.replies,
      },
      viewer?.id ?? null,
      nowMs
    )
  );

  const myRooms: MyRoom[] = myMemberships.map((m) => ({
    id: m.room.id,
    slug: m.room.slug,
    name: m.room.name,
    unread: 0,
    isPrivate: Boolean(m.room.passwordHash),
    emoji: DEFAULT_ROOM_EMOJI,
  }));

  const currentUser: RoomBoardViewer | null = viewer
    ? {
        id: viewer.id,
        name: viewer.username,
        alias: resolveAuthorAlias(viewer),
        notifications: unreadNotifications,
      }
    : null;

  return {
    room: mappedRoom,
    membership,
    initialPosts,
    currentUser,
    myRooms,
    serverTime: now.toISOString(),
  };
}

export async function createRoomPost(input: {
  roomId: string;
  content: string;
}): Promise<ActionResult<BoardPostSummary>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนตั้งกระทู้' };
    }

    if (!isUuid(input.roomId)) {
      return { ok: false, error: 'ไม่พบห้องที่ต้องการโพสต์' };
    }

    const validated = validatePostContent(input.content);
    if (!validated.ok) {
      return validated;
    }

    const [room, member] = await Promise.all([
      prisma.room.findUnique({
        where: { id: input.roomId },
        select: { id: true, slug: true, status: true, isLocked: true },
      }),
      prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId: viewer.id,
            roomId: input.roomId,
          },
        },
        select: { status: true },
      }),
    ]);

    if (!room || room.status !== 'active') {
      return { ok: false, error: 'ไม่พบห้องที่ต้องการโพสต์' };
    }

    const permission = canMemberPostInRoom({
      isLocked: room.isLocked,
      memberStatus: member?.status,
    });
    if (!permission.ok) {
      return permission;
    }

    const created = await prisma.message.create({
      data: {
        roomId: room.id,
        authorId: viewer.id,
        content: validated.value,
        parentId: null,
        status: 'visible',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayUsername: true,
            name: true,
          },
        },
      },
    });

    revalidateRoomPaths(room.id, room.slug);

    return {
      ok: true,
      data: mapDbPostToBoardPost(
        {
          id: created.id,
          roomId: created.roomId,
          content: created.content,
          createdAt: created.createdAt,
          authorId: created.authorId,
          author: created.author,
          reactions: [],
          replyCount: 0,
        },
        viewer.id
      ),
    };
  }, 'ไม่สามารถตั้งกระทู้ได้ กรุณาลองใหม่อีกครั้ง');
}

export async function updateRoomPost(input: {
  roomId: string;
  postId: string;
  content: string;
}): Promise<ActionResult<BoardPostSummary>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนแก้ไขกระทู้' };
    }

    if (!isUuid(input.roomId) || !isUuid(input.postId)) {
      return { ok: false, error: 'ไม่พบกระทู้ที่ต้องการแก้ไข' };
    }

    const validated = validatePostContent(input.content);
    if (!validated.ok) {
      return validated;
    }

    const [existing, member] = await Promise.all([
      prisma.message.findFirst({
        where: {
          id: input.postId,
          roomId: input.roomId,
          parentId: null,
          status: 'visible',
        },
        select: {
          id: true,
          authorId: true,
          room: { select: { slug: true, status: true, isLocked: true } },
        },
      }),
      prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId: viewer.id,
            roomId: input.roomId,
          },
        },
        select: { status: true },
      }),
    ]);

    if (!existing || existing.room.status !== 'active') {
      return { ok: false, error: 'ไม่พบกระทู้ที่ต้องการแก้ไข' };
    }

    if (existing.authorId !== viewer.id) {
      return { ok: false, error: 'คุณไม่มีสิทธิ์แก้ไขกระทู้นี้' };
    }

    const editPermission = canMemberEditPostInRoom({
      isLocked: existing.room.isLocked,
      memberStatus: member?.status,
    });
    if (!editPermission.ok) {
      return editPermission;
    }

    const updated = await prisma.message.update({
      where: { id: existing.id },
      data: { content: validated.value },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayUsername: true,
            name: true,
          },
        },
        reactions: {
          orderBy: { createdAt: 'asc' },
          select: {
            emojiType: true,
            userId: true,
          },
        },
        _count: {
          select: {
            replies: {
              where: { status: 'visible' },
            },
          },
        },
      },
    });

    revalidateRoomPaths(input.roomId, existing.room.slug);

    const mapped = mapDbPostToBoardPost(
      {
        id: updated.id,
        roomId: updated.roomId,
        content: updated.content,
        createdAt: updated.createdAt,
        authorId: updated.authorId,
        author: updated.author,
        reactions: updated.reactions,
        replyCount: updated._count.replies,
      },
      viewer.id
    );

    return {
      ok: true,
      data: {
        ...mapped,
        isEdited: true,
      },
    };
  }, 'ไม่สามารถแก้ไขกระทู้ได้ กรุณาลองใหม่อีกครั้ง');
}

export async function deleteRoomPost(input: {
  roomId: string;
  postId: string;
}): Promise<ActionResult<{ postId: string }>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนลบกระทู้' };
    }

    if (!isUuid(input.roomId) || !isUuid(input.postId)) {
      return { ok: false, error: 'ไม่พบกระทู้ที่ต้องการลบ' };
    }

    const existing = await prisma.message.findFirst({
      where: {
        id: input.postId,
        roomId: input.roomId,
        parentId: null,
        status: 'visible',
        room: { status: 'active' },
      },
      select: {
        id: true,
        authorId: true,
        room: { select: { slug: true } },
      },
    });

    if (!existing) {
      return { ok: false, error: 'ไม่พบกระทู้ที่ต้องการลบ' };
    }

    if (existing.authorId !== viewer.id) {
      return { ok: false, error: 'คุณไม่มีสิทธิ์ลบกระทู้นี้' };
    }

    await prisma.message.update({
      where: { id: existing.id },
      data: { status: 'deleted' },
    });

    revalidateRoomPaths(input.roomId, existing.room.slug);

    return { ok: true, data: { postId: existing.id } };
  }, 'ไม่สามารถลบกระทู้ได้ กรุณาลองใหม่อีกครั้ง');
}

export async function toggleRoomPostReaction(input: {
  roomId: string;
  postId: string;
  emoji: string;
}): Promise<ActionResult<{ postId: string; reactions: ReactionItem[] }>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนกดรีแอคชัน' };
    }

    const emoji = input.emoji.trim();
    if (!emoji || emoji.length > 32) {
      return { ok: false, error: 'อีโมจิไม่ถูกต้อง' };
    }

    if (!isUuid(input.roomId) || !isUuid(input.postId)) {
      return { ok: false, error: 'ไม่พบกระทู้ที่ต้องการรีแอคชัน' };
    }

    const [post, member] = await Promise.all([
      prisma.message.findFirst({
        where: {
          id: input.postId,
          roomId: input.roomId,
          parentId: null,
          status: 'visible',
        },
        select: {
          id: true,
          room: { select: { slug: true, status: true, passwordHash: true } },
        },
      }),
      prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId: viewer.id,
            roomId: input.roomId,
          },
        },
        select: { status: true },
      }),
    ]);

    if (!post || post.room.status !== 'active') {
      return { ok: false, error: 'ไม่พบกระทู้ที่ต้องการรีแอคชัน' };
    }

    const reactPermission = canMemberReactInRoom({
      isPrivate: Boolean(post.room.passwordHash),
      memberStatus: member?.status,
    });
    if (!reactPermission.ok) {
      return reactPermission;
    }

    const updatedReactions = await prisma.$transaction(async (tx) => {
      const existing = await tx.reaction.findUnique({
        where: {
          messageId_userId_emojiType: {
            messageId: post.id,
            userId: viewer.id,
            emojiType: emoji,
          },
        },
        select: { id: true },
      });

      if (existing) {
        await tx.reaction.delete({ where: { id: existing.id } });
      } else {
        await tx.reaction.create({
          data: {
            messageId: post.id,
            userId: viewer.id,
            emojiType: emoji,
          },
        });
      }

      return tx.reaction.findMany({
        where: { messageId: post.id },
        orderBy: { createdAt: 'asc' },
        select: {
          emojiType: true,
          userId: true,
        },
      });
    });

    revalidateRoomPaths(input.roomId, post.room.slug);

    return {
      ok: true,
      data: {
        postId: post.id,
        reactions: aggregateReactions(updatedReactions, viewer.id),
      },
    };
  }, 'ไม่สามารถอัปเดตรีแอคชันได้ กรุณาลองใหม่อีกครั้ง');
}

export async function updateRoomMembership(input: {
  roomId: string;
  action: 'join' | 'leave';
}): Promise<ActionResult<RoomBoardMembershipState>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    if (!isUuid(input.roomId)) {
      return { ok: false, error: 'ไม่พบห้องที่ต้องการ' };
    }

    const [room, existingMembership] = await Promise.all([
      prisma.room.findUnique({
        where: { id: input.roomId },
        select: {
          id: true,
          slug: true,
          status: true,
          isLocked: true,
          passwordHash: true,
        },
      }),
      prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId: viewer.id,
            roomId: input.roomId,
          },
        },
        select: { status: true, role: true },
      }),
    ]);

    if (!room || room.status !== 'active') {
      return { ok: false, error: 'ไม่พบห้องที่ต้องการ' };
    }

    if (
      existingMembership?.status === 'banned' ||
      existingMembership?.status === 'muted'
    ) {
      return { ok: false, error: 'คุณถูกจำกัดสิทธิ์การเข้าร่วมห้องนี้' };
    }

    if (input.action === 'join') {
      if (room.isLocked) {
        return { ok: false, error: 'ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถเข้าร่วมได้' };
      }

      if (room.passwordHash && existingMembership?.status !== 'active') {
        return {
          ok: false,
          error: 'ห้องส่วนตัวต้องได้รับอนุมัติหรือรหัสผ่านก่อนเข้าร่วม',
        };
      }

      await prisma.roomMember.upsert({
        where: {
          userId_roomId: {
            userId: viewer.id,
            roomId: room.id,
          },
        },
        create: {
          userId: viewer.id,
          roomId: room.id,
          role: 'member',
          status: 'active',
        },
        update: {
          status: 'active',
          joinedAt: new Date(),
        },
      });
    } else {
      if (existingMembership?.status === 'active') {
        await prisma.roomMember.update({
          where: {
            userId_roomId: {
              userId: viewer.id,
              roomId: room.id,
            },
          },
          data: { status: 'left' },
        });
      }
    }

    const memberCount = await prisma.roomMember.count({
      where: {
        roomId: room.id,
        status: 'active',
      },
    });

    revalidateRoomPaths(room.id, room.slug);

    const nextStatus = input.action === 'join' ? 'active' : 'left';
    return {
      ok: true,
      data: mapDbMembershipToBoardState(memberCount, nextStatus),
    };
  }, 'ไม่สามารถอัปเดตสถานะการเข้าร่วมห้องได้ กรุณาลองใหม่อีกครั้ง');
}

export async function reportRoomTarget(input: {
  roomId: string;
  postId?: string;
  reason: ReportReason;
  details?: string;
}): Promise<ActionResult<{ reported: true }>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนส่งรายงาน' };
    }

    if (!isUuid(input.roomId)) {
      return { ok: false, error: 'ไม่พบห้องที่ต้องการรายงาน' };
    }

    if (!VALID_REPORT_REASONS.has(input.reason)) {
      return { ok: false, error: 'เหตุผลการรายงานไม่ถูกต้อง' };
    }

    let targetMessageId: string | null = null;
    if (input.postId) {
      if (!isUuid(input.postId)) {
        return { ok: false, error: 'ไม่พบกระทู้ที่ต้องการรายงาน' };
      }
      const post = await prisma.message.findFirst({
        where: {
          id: input.postId,
          roomId: input.roomId,
          status: 'visible',
          room: { status: 'active' },
        },
        select: { id: true, authorId: true },
      });
      if (!post) {
        return { ok: false, error: 'ไม่พบกระทู้ที่ต้องการรายงาน' };
      }
      if (post.authorId === viewer.id) {
        return { ok: false, error: 'ไม่สามารถรายงานกระทู้ของตนเองได้' };
      }
      targetMessageId = post.id;
    } else {
      const latestPost = await prisma.message.findFirst({
        where: {
          roomId: input.roomId,
          status: 'visible',
          room: { status: 'active' },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, authorId: true },
      });
      if (!latestPost) {
        return {
          ok: false,
          error: 'ยังไม่มีข้อความในห้องนี้ให้แนบในรายงาน',
        };
      }
      targetMessageId = latestPost.id;
    }

    const formattedReason = formatReportReason(input.reason, input.details);

    await prisma.report.upsert({
      where: {
        reporterId_messageId: {
          reporterId: viewer.id,
          messageId: targetMessageId,
        },
      },
      create: {
        reporterId: viewer.id,
        messageId: targetMessageId,
        roomId: input.roomId,
        reason: formattedReason,
        status: 'pending',
      },
      update: {
        reason: formattedReason,
        status: 'pending',
      },
    });

    return { ok: true, data: { reported: true } };
  }, 'ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง');
}
