import type {
  PostThread,
  ThreadAuthor,
  ThreadComment,
  ThreadReply,
} from '@/types/post-thread';
import {
  aggregateReactions,
  resolveAuthorAlias,
  type DbAuthorSnapshot,
  type DbMemberStatus,
  type DbReactionRow,
} from './room-board.ts';

export const MAX_COMMENT_CONTENT_LENGTH = 2000;

export interface DbThreadMessageRow {
  id: string;
  roomId: string;
  parentId: string | null;
  content: string;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: Date;
  authorId: string | null;
  author: DbAuthorSnapshot | null;
  reactions: readonly DbReactionRow[];
}

export function validateCommentContent(
  content: string
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, error: 'กรุณาพิมพ์ข้อความก่อนส่งความคิดเห็น' };
  }
  if (trimmed.length > MAX_COMMENT_CONTENT_LENGTH) {
    return {
      ok: false,
      error: `เนื้อหาความคิดเห็นยาวเกินไป (สูงสุด ${MAX_COMMENT_CONTENT_LENGTH} ตัวอักษร)`,
    };
  }
  return { ok: true, value: trimmed };
}

/** Validates whether a user may post comments or nested replies in a room. */
export function canMemberCommentInRoom(input: {
  isLocked: boolean;
  memberStatus: DbMemberStatus | null | undefined;
}): { ok: true } | { ok: false; error: string } {
  if (input.isLocked) {
    return {
      ok: false,
      error: 'ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถแสดงความคิดเห็นได้',
    };
  }
  if (!input.memberStatus || input.memberStatus === 'left') {
    return {
      ok: false,
      error: 'กรุณาเข้าร่วมห้องก่อนแสดงความคิดเห็น',
    };
  }
  if (input.memberStatus === 'muted') {
    return {
      ok: false,
      error: 'คุณถูกจำกัดสิทธิ์การแสดงความคิดเห็นในห้องนี้ชั่วคราว',
    };
  }
  if (input.memberStatus === 'banned') {
    return {
      ok: false,
      error: 'คุณถูกระงับสิทธิ์การใช้งานในห้องนี้',
    };
  }
  return { ok: true };
}

function compareMessagesChronologically(
  a: Pick<DbThreadMessageRow, 'createdAt' | 'id'>,
  b: Pick<DbThreadMessageRow, 'createdAt' | 'id'>
): number {
  return (
    a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id)
  );
}

function toThreadAuthor(
  authorId: string | null,
  author: DbAuthorSnapshot | null
): ThreadAuthor {
  return {
    id: authorId ?? 'deleted-user',
    name: resolveAuthorAlias(author),
  };
}

/** Reconstructs the 2-level UI thread hierarchy directly from Message.parentId rows. */
export function buildPostThreadFromMessages(input: {
  room: { slug: string; name: string };
  post: DbThreadMessageRow;
  messages: readonly DbThreadMessageRow[];
  currentUserId?: string | null;
}): PostThread {
  const { room, post, messages, currentUserId } = input;
  const visibleReplies = messages.filter(
    (msg) => msg.status === 'visible' && msg.parentId !== null
  );

  const visibleById = new Map<string, DbThreadMessageRow>();
  const childrenByParent = new Map<string, DbThreadMessageRow[]>();

  for (const msg of visibleReplies) {
    visibleById.set(msg.id, msg);
    if (!msg.parentId) continue;
    const siblings = childrenByParent.get(msg.parentId);
    if (siblings) {
      siblings.push(msg);
    } else {
      childrenByParent.set(msg.parentId, [msg]);
    }
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort(compareMessagesChronologically);
  }

  const topLevelComments = [...(childrenByParent.get(post.id) ?? [])].sort(
    compareMessagesChronologically
  );

  const mappedComments: ThreadComment[] = topLevelComments.map((comment) => {
    const commentAuthor = toThreadAuthor(comment.authorId, comment.author);
    const descendants: DbThreadMessageRow[] = [];
    const visited = new Set<string>([comment.id]);
    const queue: DbThreadMessageRow[] = [
      ...(childrenByParent.get(comment.id) ?? []),
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      descendants.push(current);

      const children = childrenByParent.get(current.id);
      if (children) {
        queue.push(...children);
      }
    }

    descendants.sort(compareMessagesChronologically);

    const replies: ThreadReply[] = descendants.map((replyMsg) => {
      const replyAuthor = toThreadAuthor(replyMsg.authorId, replyMsg.author);
      let replyTo: ThreadReply['replyTo'];

      if (replyMsg.parentId === comment.id) {
        const isSameAuthor = Boolean(
          replyMsg.authorId &&
            comment.authorId &&
            replyMsg.authorId === comment.authorId
        );
        if (!isSameAuthor) {
          replyTo = {
            id: comment.id,
            name: commentAuthor.name,
            isNested: false,
          };
        }
      } else if (replyMsg.parentId) {
        const parentMsg = visibleById.get(replyMsg.parentId);
        replyTo = {
          id: parentMsg?.id ?? replyMsg.parentId,
          name: resolveAuthorAlias(parentMsg?.author),
          isNested: true,
        };
      }

      return {
        id: replyMsg.id,
        author: replyAuthor,
        ...(replyTo ? { replyTo } : {}),
        isPostAuthor: Boolean(post.authorId && replyMsg.authorId === post.authorId),
        content: replyMsg.content,
        createdAt: replyMsg.createdAt.toISOString(),
        reactions: aggregateReactions(replyMsg.reactions, currentUserId),
      };
    });

    return {
      id: comment.id,
      author: commentAuthor,
      isPostAuthor: Boolean(post.authorId && comment.authorId === post.authorId),
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      reactions: aggregateReactions(comment.reactions, currentUserId),
      replies,
    };
  });

  return {
    id: post.id,
    boardSlug: room.slug,
    boardName: room.name,
    author: toThreadAuthor(post.authorId, post.author),
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    reactions: aggregateReactions(post.reactions, currentUserId),
    comments: mappedComments,
  };
}

/** Verifies targetMessageId is root postId or a visible descendant reachable via visible ancestors. */
export function isMessageInPostSubtree(
  postId: string,
  targetMessageId: string,
  messages: readonly Pick<DbThreadMessageRow, 'id' | 'parentId' | 'status'>[]
): boolean {
  const byId = new Map<
    string,
    Pick<DbThreadMessageRow, 'id' | 'parentId' | 'status'>
  >();
  for (const msg of messages) {
    byId.set(msg.id, msg);
  }

  const rootRow = byId.get(postId);
  if (rootRow && rootRow.status !== 'visible') {
    return false;
  }

  if (targetMessageId === postId) {
    return true;
  }

  const visited = new Set<string>();
  let current = byId.get(targetMessageId);

  while (current) {
    if (visited.has(current.id)) return false;
    visited.add(current.id);

    if (current.status !== 'visible') return false;
    if (!current.parentId) return false;
    if (current.parentId === postId) return true;

    current = byId.get(current.parentId);
  }

  return false;
}

/** Returns rootMessageId followed by all descendant message IDs in breadth-first order. */
export function collectSubtreeMessageIds(
  rootMessageId: string,
  messages: readonly Pick<DbThreadMessageRow, 'id' | 'parentId'>[]
): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const msg of messages) {
    if (!msg.parentId) continue;
    const children = childrenByParent.get(msg.parentId);
    if (children) {
      children.push(msg.id);
    } else {
      childrenByParent.set(msg.parentId, [msg.id]);
    }
  }

  const collected: string[] = [rootMessageId];
  const visited = new Set<string>([rootMessageId]);
  const queue: string[] = [...(childrenByParent.get(rootMessageId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    collected.push(currentId);

    const grandchildren = childrenByParent.get(currentId);
    if (grandchildren) {
      queue.push(...grandchildren);
    }
  }

  return collected;
}

/** Collects targetId and all descendant reply IDs present inside the UI ThreadComment tree. */
export function collectClientSubtreeIds(
  comments: readonly ThreadComment[],
  targetId: string
): string[] {
  for (const comment of comments) {
    if (comment.id === targetId) {
      return [comment.id, ...comment.replies.map((reply) => reply.id)];
    }

    if (!comment.replies.some((reply) => reply.id === targetId)) {
      continue;
    }

    const collected = [targetId];
    const deletedSet = new Set<string>([targetId]);
    let added = true;
    while (added) {
      added = false;
      for (const reply of comment.replies) {
        if (
          !deletedSet.has(reply.id) &&
          reply.replyTo?.id &&
          deletedSet.has(reply.replyTo.id)
        ) {
          deletedSet.add(reply.id);
          collected.push(reply.id);
          added = true;
        }
      }
    }
    return collected;
  }

  return [];
}

/** Filters out any top-level comments or nested replies matching deletedIds. */
export function removeDeletedIdsFromComments(
  comments: readonly ThreadComment[],
  deletedIds: Iterable<string>
): ThreadComment[] {
  const deletedSet = new Set(deletedIds);
  if (deletedSet.size === 0) {
    return [...comments];
  }

  return comments
    .filter((comment) => !deletedSet.has(comment.id))
    .map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => !deletedSet.has(reply.id)),
    }));
}

/** Optimistically deletes an authored comment/reply and all of its nested descendants in UI state. */
export function deleteCommentSubtreeOptimistic(
  comments: readonly ThreadComment[],
  targetId: string,
  currentUserId: string
): { nextComments: ThreadComment[]; removedIds: string[] } {
  const normalizedUserId = currentUserId.trim();
  if (!normalizedUserId) {
    return { nextComments: [...comments], removedIds: [] };
  }

  let ownerId: string | null = null;
  for (const comment of comments) {
    if (comment.id === targetId) {
      ownerId = comment.author.id;
      break;
    }
    const targetReply = comment.replies.find((reply) => reply.id === targetId);
    if (targetReply) {
      ownerId = targetReply.author.id;
      break;
    }
  }

  if (!ownerId || ownerId !== normalizedUserId) {
    return { nextComments: [...comments], removedIds: [] };
  }

  const removedIds = collectClientSubtreeIds(comments, targetId);
  return {
    nextComments: removeDeletedIdsFromComments(comments, removedIds),
    removedIds,
  };
}
