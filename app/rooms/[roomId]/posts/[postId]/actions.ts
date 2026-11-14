'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { toggleMessageReaction } from '@/lib/reaction-service';
import {
  formatReportReason,
  getViewerUser,
  runSafeMutation,
  VALID_REPORT_REASONS,
  type ActionResult,
} from '@/lib/server-action-helpers';
import {
  buildPostThreadFromMessages,
  canMemberCommentInRoom,
  collectSubtreeMessageIds,
  isMessageInPostSubtree,
  validateCommentContent,
} from '@/lib/post-thread-mapper';
import {
  canMemberEditPostInRoom,
  canMemberReactInRoom,
  DEFAULT_ROOM_EMOJI,
  isUuid,
  resolveAuthorAlias,
  resolveRoomLookupTarget,
  type DbMemberStatus,
} from '@/lib/room-board';
import type { MyRoom } from '@/types/room';
import type {
  PostThread,
  ReactionItem,
  ReportReason,
} from '@/types/post-thread';

export type { ActionResult };

export interface PostThreadViewer {
  id: string;
  alias: string;
  notifications: number;
}

export interface PostThreadPageData {
  room: {
    id: string;
    slug: string;
    name: string;
    isPrivate: boolean;
    isLocked: boolean;
  };
  memberStatus: DbMemberStatus | null;
  canComment: boolean;
  canReact: boolean;
  thread: PostThread;
  currentUser: PostThreadViewer | null;
  myRooms: MyRoom[];
  serverTime: string;
}

function normalizeUuid(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  return isUuid(trimmed) ? trimmed : null;
}

function revalidateThreadPaths(roomId: string, roomSlug: string, postId: string) {
  revalidatePath(`/rooms/${roomSlug}/posts/${postId}`);
  revalidatePath(`/rooms/${roomId}/posts/${postId}`);
  revalidatePath(`/rooms/${roomSlug}`);
  revalidatePath(`/rooms/${roomId}`);
}

async function loadMutationContext(input: {
  roomId: string;
  postId: string;
  viewerId: string;
}) {
  const [room, membership, rootPost] = await Promise.all([
    prisma.room.findUnique({
      where: { id: input.roomId },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        isLocked: true,
        passwordHash: true,
      },
    }),
    prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: input.viewerId,
          roomId: input.roomId,
        },
      },
      select: { status: true },
    }),
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
      },
    }),
  ]);

  if (!room || room.status !== 'active' || !rootPost) {
    return null;
  }

  return {
    room,
    memberStatus: (membership?.status as DbMemberStatus | undefined) ?? null,
    rootPost,
  };
}

async function loadPostThreadSnapshot(
  room: { id: string; slug: string; name: string },
  postId: string,
  viewerId: string | null
): Promise<PostThread | null> {
  const [rootPost, replyRows] = await Promise.all([
    prisma.message.findFirst({
      where: {
        id: postId,
        roomId: room.id,
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
        reactions: {
          orderBy: { createdAt: 'asc' },
          select: {
            emojiType: true,
            userId: true,
          },
        },
      },
    }),
    prisma.message.findMany({
      where: {
        roomId: room.id,
        parentId: { not: null },
        status: 'visible',
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
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
      },
    }),
  ]);

  if (!rootPost) {
    return null;
  }

  return buildPostThreadFromMessages({
    room: { slug: room.slug, name: room.name },
    post: rootPost,
    messages: replyRows,
    currentUserId: viewerId,
  });
}

export async function getPostThreadData(
  roomIdOrSlug: string,
  postId: string
): Promise<PostThreadPageData | null> {
  const target = resolveRoomLookupTarget(roomIdOrSlug);
  const normalizedPostId = normalizeUuid(postId);
  if (!target || !normalizedPostId) {
    return null;
  }

  const now = new Date();
  const [roomRecord, viewer] = await Promise.all([
    prisma.room.findUnique({
      where: target.kind === 'id' ? { id: target.id } : { slug: target.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        isLocked: true,
        passwordHash: true,
      },
    }),
    getViewerUser(),
  ]);

  if (!roomRecord || roomRecord.status !== 'active') {
    return null;
  }

  const [rootPost, viewerMembership, myMemberships, unreadNotifications] =
    await Promise.all([
      prisma.message.findFirst({
        where: {
          id: normalizedPostId,
          roomId: roomRecord.id,
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
          reactions: {
            orderBy: { createdAt: 'asc' },
            select: {
              emojiType: true,
              userId: true,
            },
          },
        },
      }),
      viewer
        ? prisma.roomMember.findUnique({
            where: {
              userId_roomId: {
                userId: viewer.id,
                roomId: roomRecord.id,
              },
            },
            select: { status: true },
          })
        : Promise.resolve(null),
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

  if (!rootPost) {
    return null;
  }

  const memberStatus =
    (viewerMembership?.status as DbMemberStatus | undefined) ?? null;
  const isPrivate = Boolean(roomRecord.passwordHash);

  const myRooms: MyRoom[] = myMemberships.map((m) => ({
    id: m.room.id,
    slug: m.room.slug,
    name: m.room.name,
    unread: 0,
    isPrivate: Boolean(m.room.passwordHash),
    emoji: DEFAULT_ROOM_EMOJI,
  }));

  const currentUser: PostThreadViewer | null = viewer
    ? {
        id: viewer.id,
        alias: resolveAuthorAlias(viewer),
        notifications: unreadNotifications,
      }
    : null;

  if (isPrivate && memberStatus !== 'active') {
    const emptyThread = buildPostThreadFromMessages({
      room: { slug: roomRecord.slug, name: roomRecord.name },
      post: {
        ...rootPost,
        content: '',
        authorId: null,
        author: null,
        reactions: [],
      },
      messages: [],
      currentUserId: null,
    });

    return {
      room: {
        id: roomRecord.id,
        slug: roomRecord.slug,
        name: roomRecord.name,
        isPrivate,
        isLocked: roomRecord.isLocked,
      },
      memberStatus,
      canComment: false,
      canReact: false,
      thread: emptyThread,
      currentUser,
      myRooms,
      serverTime: now.toISOString(),
    };
  }

  const replyRows = await prisma.message.findMany({
    where: {
      roomId: roomRecord.id,
      parentId: { not: null },
      status: 'visible',
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
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
    },
  });

  const thread = buildPostThreadFromMessages({
    room: { slug: roomRecord.slug, name: roomRecord.name },
    post: rootPost,
    messages: replyRows,
    currentUserId: viewer?.id ?? null,
  });

  const canComment = Boolean(
    viewer &&
      canMemberCommentInRoom({
        isLocked: roomRecord.isLocked,
        memberStatus,
      }).ok
  );
  const canReact = Boolean(
    viewer &&
      canMemberReactInRoom({
        isPrivate,
        memberStatus,
      }).ok
  );

  return {
    room: {
      id: roomRecord.id,
      slug: roomRecord.slug,
      name: roomRecord.name,
      isPrivate,
      isLocked: roomRecord.isLocked,
    },
    memberStatus,
    canComment,
    canReact,
    thread,
    currentUser,
    myRooms,
    serverTime: now.toISOString(),
  };
}

export async function createThreadReply(input: {
  roomId: string;
  postId: string;
  parentId: string;
  content: string;
}): Promise<ActionResult<{ thread: PostThread }>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น' };
    }

    const roomId = normalizeUuid(input.roomId);
    const postId = normalizeUuid(input.postId);
    const parentId = normalizeUuid(input.parentId);
    if (!roomId || !postId || !parentId) {
      return { ok: false, error: 'ไม่พบกระทู้หรือความคิดเห็นที่ต้องการตอบกลับ' };
    }

    const validated = validateCommentContent(input.content);
    if (!validated.ok) {
      return validated;
    }

    const context = await loadMutationContext({
      roomId,
      postId,
      viewerId: viewer.id,
    });
    if (!context) {
      return { ok: false, error: 'ไม่พบกระทู้ที่ต้องการแสดงความคิดเห็น' };
    }

    const commentPermission = canMemberCommentInRoom({
      isLocked: context.room.isLocked,
      memberStatus: context.memberStatus,
    });
    if (!commentPermission.ok) {
      return commentPermission;
    }

    const visibleMessages = await prisma.message.findMany({
      where: {
        roomId: context.room.id,
        parentId: { not: null },
        status: 'visible',
      },
      select: {
        id: true,
        parentId: true,
        status: true,
        authorId: true,
      },
    });

    if (!isMessageInPostSubtree(context.rootPost.id, parentId, visibleMessages)) {
      return { ok: false, error: 'ไม่พบความคิดเห็นที่ต้องการตอบกลับ' };
    }

    const parentAuthorId =
      parentId === context.rootPost.id
        ? context.rootPost.authorId
        : visibleMessages.find((m) => m.id === parentId)?.authorId ?? null;

    await prisma.$transaction(async (tx) => {
      await tx.message.create({
        data: {
          roomId: context.room.id,
          authorId: viewer.id,
          parentId,
          content: validated.value,
          status: 'visible',
        },
      });

      if (parentAuthorId && parentAuthorId !== viewer.id) {
        await tx.notification.create({
          data: {
            userId: parentAuthorId,
            type: 'reply',
            isRead: false,
          },
        });
      }
    });

    revalidateThreadPaths(context.room.id, context.room.slug, context.rootPost.id);

    const thread = await loadPostThreadSnapshot(
      context.room,
      context.rootPost.id,
      viewer.id
    );
    if (!thread) {
      return { ok: false, error: 'ไม่พบกระทู้นี้ในระบบ' };
    }

    return { ok: true, data: { thread } };
  }, 'ไม่สามารถส่งความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง');
}

export async function updateThreadMessage(input: {
  roomId: string;
  postId: string;
  messageId: string;
  content: string;
}): Promise<ActionResult<{ messageId: string; content: string }>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนแก้ไขความคิดเห็น' };
    }

    const roomId = normalizeUuid(input.roomId);
    const postId = normalizeUuid(input.postId);
    const messageId = normalizeUuid(input.messageId);
    if (!roomId || !postId || !messageId || messageId === postId) {
      return { ok: false, error: 'ไม่พบความคิดเห็นที่ต้องการแก้ไข' };
    }

    const validated = validateCommentContent(input.content);
    if (!validated.ok) {
      return validated;
    }

    const context = await loadMutationContext({
      roomId,
      postId,
      viewerId: viewer.id,
    });
    if (!context) {
      return { ok: false, error: 'ไม่พบความคิดเห็นที่ต้องการแก้ไข' };
    }

    if (context.room.passwordHash && context.memberStatus !== 'active') {
      return {
        ok: false,
        error: 'เฉพาะสมาชิกของห้องส่วนตัวเท่านั้นที่สามารถดำเนินการได้',
      };
    }

    const editPermission = canMemberEditPostInRoom({
      isLocked: context.room.isLocked,
      memberStatus: context.memberStatus,
    });
    if (!editPermission.ok) {
      return editPermission;
    }

    const visibleMessages = await prisma.message.findMany({
      where: {
        roomId: context.room.id,
        parentId: { not: null },
        status: 'visible',
      },
      select: {
        id: true,
        parentId: true,
        status: true,
        authorId: true,
      },
    });

    const target = visibleMessages.find((m) => m.id === messageId);
    if (
      !target ||
      !isMessageInPostSubtree(context.rootPost.id, messageId, visibleMessages)
    ) {
      return { ok: false, error: 'ไม่พบความคิดเห็นที่ต้องการแก้ไข' };
    }

    if (target.authorId !== viewer.id) {
      return { ok: false, error: 'คุณแก้ไขได้เฉพาะความคิดเห็นของตัวเองเท่านั้น' };
    }

    const updated = await prisma.message.update({
      where: { id: target.id },
      data: { content: validated.value },
      select: { id: true, content: true },
    });

    revalidateThreadPaths(context.room.id, context.room.slug, context.rootPost.id);

    return {
      ok: true,
      data: {
        messageId: updated.id,
        content: updated.content,
      },
    };
  }, 'ไม่สามารถแก้ไขความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง');
}

export async function deleteThreadMessage(input: {
  roomId: string;
  postId: string;
  messageId: string;
}): Promise<ActionResult<{ deletedIds: string[] }>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนลบความคิดเห็น' };
    }

    const roomId = normalizeUuid(input.roomId);
    const postId = normalizeUuid(input.postId);
    const messageId = normalizeUuid(input.messageId);
    if (!roomId || !postId || !messageId || messageId === postId) {
      return { ok: false, error: 'ไม่พบความคิดเห็นที่ต้องการลบ' };
    }

    const context = await loadMutationContext({
      roomId,
      postId,
      viewerId: viewer.id,
    });
    if (!context) {
      return { ok: false, error: 'ไม่พบความคิดเห็นที่ต้องการลบ' };
    }

    if (context.room.passwordHash && context.memberStatus !== 'active') {
      return {
        ok: false,
        error: 'เฉพาะสมาชิกของห้องส่วนตัวเท่านั้นที่สามารถดำเนินการได้',
      };
    }

    if (context.memberStatus === 'muted') {
      return { ok: false, error: 'คุณถูกจำกัดสิทธิ์การใช้งานในห้องนี้ชั่วคราว' };
    }
    if (context.memberStatus === 'banned') {
      return { ok: false, error: 'คุณถูกระงับสิทธิ์การใช้งานในห้องนี้' };
    }

    const allRoomMessages = await prisma.message.findMany({
      where: {
        roomId: context.room.id,
        parentId: { not: null },
      },
      select: {
        id: true,
        parentId: true,
        status: true,
        authorId: true,
      },
    });

    const target = allRoomMessages.find((m) => m.id === messageId);
    if (
      !target ||
      !isMessageInPostSubtree(context.rootPost.id, messageId, allRoomMessages)
    ) {
      return { ok: false, error: 'ไม่พบความคิดเห็นที่ต้องการลบ' };
    }

    if (target.authorId !== viewer.id) {
      return { ok: false, error: 'คุณลบได้เฉพาะความคิดเห็นของตัวเองเท่านั้น' };
    }

    const deletedIds = collectSubtreeMessageIds(target.id, allRoomMessages);

    await prisma.message.updateMany({
      where: {
        id: { in: deletedIds },
        roomId: context.room.id,
      },
      data: { status: 'deleted' },
    });

    revalidateThreadPaths(context.room.id, context.room.slug, context.rootPost.id);

    return { ok: true, data: { deletedIds } };
  }, 'ไม่สามารถลบความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง');
}

export async function toggleThreadReaction(input: {
  roomId: string;
  postId: string;
  messageId: string;
  emoji: string;
}): Promise<ActionResult<{ messageId: string; reactions: ReactionItem[] }>> {
  return runSafeMutation(async () => {
    const result = await toggleMessageReaction({
      roomId: input.roomId,
      postId: input.postId,
      messageId: input.messageId,
      emoji: input.emoji,
    });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    return {
      ok: true,
      data: {
        messageId: result.data.messageId,
        reactions: result.data.reactions,
      },
    };
  }, 'ไม่สามารถอัปเดตรีแอคชันได้ กรุณาลองใหม่อีกครั้ง');
}

export async function reportThreadTarget(input: {
  roomId: string;
  postId: string;
  messageId: string;
  reason: ReportReason;
  details?: string;
}): Promise<ActionResult<{ reported: true }>> {
  return runSafeMutation(async () => {
    const viewer = await getViewerUser();
    if (!viewer) {
      return { ok: false, error: 'กรุณาเข้าสู่ระบบก่อนส่งรายงาน' };
    }

    const roomId = normalizeUuid(input.roomId);
    const postId = normalizeUuid(input.postId);
    const messageId = normalizeUuid(input.messageId);
    if (!roomId || !postId || !messageId) {
      return { ok: false, error: 'ไม่พบข้อความที่ต้องการรายงาน' };
    }

    if (!VALID_REPORT_REASONS.has(input.reason)) {
      return { ok: false, error: 'เหตุผลการรายงานไม่ถูกต้อง' };
    }

    const context = await loadMutationContext({
      roomId,
      postId,
      viewerId: viewer.id,
    });
    if (!context) {
      return { ok: false, error: 'ไม่พบข้อความที่ต้องการรายงาน' };
    }

    const reportPermission = canMemberReactInRoom({
      isPrivate: Boolean(context.room.passwordHash),
      memberStatus: context.memberStatus,
    });
    if (!reportPermission.ok) {
      return reportPermission;
    }

    const visibleMessages = await prisma.message.findMany({
      where: {
        roomId: context.room.id,
        parentId: { not: null },
        status: 'visible',
      },
      select: {
        id: true,
        parentId: true,
        status: true,
        authorId: true,
      },
    });

    if (!isMessageInPostSubtree(context.rootPost.id, messageId, visibleMessages)) {
      return { ok: false, error: 'ไม่พบข้อความที่ต้องการรายงาน' };
    }

    const targetAuthorId =
      messageId === context.rootPost.id
        ? context.rootPost.authorId
        : visibleMessages.find((m) => m.id === messageId)?.authorId ?? null;

    if (targetAuthorId === viewer.id) {
      return { ok: false, error: 'ไม่สามารถรายงานข้อความของตนเองได้' };
    }

    const formattedReason = formatReportReason(input.reason, input.details);

    await prisma.report.upsert({
      where: {
        reporterId_messageId: {
          reporterId: viewer.id,
          messageId,
        },
      },
      create: {
        reporterId: viewer.id,
        messageId,
        roomId: context.room.id,
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
