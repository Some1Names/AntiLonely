import type {
  BoardMembershipStatus,
  BoardPostSummary,
  CommentSortOrder,
  PostThread,
  ReactionItem,
  RoomBoardMembershipState,
  ThreadAuthor,
  ThreadBranch,
  ThreadComment,
  ThreadReply,
} from '@/types/post-thread';

export const PRESET_REACTION_EMOJIS: readonly string[] = [
  '❤️',
  '👍',
  '😂',
  '🤩',
  '🔥',
  '😮',
  '😢',
  '😭',
  '😣',
];

export const INITIAL_PICKER_EMOJIS: readonly string[] =
  PRESET_REACTION_EMOJIS.slice(0, 4);

export const REMAINING_PICKER_EMOJIS: readonly string[] =
  PRESET_REACTION_EMOJIS.slice(4);

export const REACTION_SIZES = {
  md: { emoji: 18, addIcon: 20 }, // feed + thread main post
  sm: { emoji: 16, addIcon: 18 }, // thread comments
} as const;

export type ReactionSize = keyof typeof REACTION_SIZES;

export function toggleReaction(
  reactions: ReactionItem[],
  emoji: string
): ReactionItem[] {
  const normalized = emoji.trim();
  if (!normalized) {
    return reactions;
  }

  const existingIndex = reactions.findIndex((item) => item.emoji === normalized);
  if (existingIndex === -1) {
    return [
      ...reactions,
      {
        emoji: normalized,
        count: 1,
        reactedByMe: true,
      },
    ];
  }

  const result: ReactionItem[] = [];
  for (let i = 0; i < reactions.length; i++) {
    const current = reactions[i];
    if (i !== existingIndex) {
      result.push(current);
      continue;
    }

    const nextCount = current.reactedByMe ? current.count - 1 : current.count + 1;
    if (nextCount > 0) {
      result.push({
        ...current,
        count: nextCount,
        reactedByMe: !current.reactedByMe,
      });
    }
  }

  return result;
}

export function togglePostReaction(
  thread: PostThread,
  emoji: string
): PostThread {
  return {
    ...thread,
    reactions: toggleReaction(thread.reactions, emoji),
  };
}

export function toggleCommentReaction(
  comments: ThreadComment[],
  targetId: string,
  emoji: string
): ThreadComment[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return {
        ...comment,
        reactions: toggleReaction(comment.reactions, emoji),
      };
    }

    const hasMatchingReply = comment.replies.some((r) => r.id === targetId);
    if (!hasMatchingReply) {
      return comment;
    }

    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === targetId
          ? {
            ...reply,
            reactions: toggleReaction(reply.reactions, emoji),
          }
          : reply
      ),
    };
  });
}

export function addTopLevelComment(
  comments: ThreadComment[],
  content: string,
  author: ThreadAuthor,
  nowIso: string = new Date().toISOString(),
  postAuthorId?: string
): ThreadComment[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return comments;
  }

  const timeSeed = Date.parse(nowIso) || Date.now();
  const newComment: ThreadComment = {
    id: `comment-${timeSeed}-${comments.length + 1}`,
    author,
    isPostAuthor: Boolean(postAuthorId && author.id === postAuthorId),
    content: trimmed,
    createdAt: nowIso,
    reactions: [],
    replies: [],
  };

  return [...comments, newComment];
}

export function addNestedReply(
  comments: ThreadComment[],
  targetCommentOrReplyId: string,
  content: string,
  author: ThreadAuthor,
  nowIso: string = new Date().toISOString(),
  postAuthorId?: string,
  replyTo?: { id?: string; name: string; isNested?: boolean }
): ThreadComment[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return comments;
  }

  return comments.map((comment) => {
    const matchesParent = comment.id === targetCommentOrReplyId;
    const matchesChild = comment.replies.some(
      (reply) => reply.id === targetCommentOrReplyId
    );

    if (!matchesParent && !matchesChild) {
      return comment;
    }

    const timeSeed = Date.parse(nowIso) || Date.now();
    const isSelfReplyToTopComment = Boolean(
      replyTo &&
      !replyTo.isNested &&
      ((replyTo.id && replyTo.id === author.id) ||
        (replyTo.name && replyTo.name === author.name))
    );
    const validReplyTo = replyTo && !isSelfReplyToTopComment ? replyTo : undefined;

    const newReply: ThreadReply = {
      id: `reply-${timeSeed}-${comment.replies.length + 1}`,
      author,
      ...(validReplyTo ? { replyTo: validReplyTo } : {}),
      isPostAuthor: Boolean(postAuthorId && author.id === postAuthorId),
      content: trimmed,
      createdAt: nowIso,
      reactions: [],
    };

    return {
      ...comment,
      replies: [...comment.replies, newReply],
    };
  });
}

export function editCommentOrReply(
  comments: ThreadComment[],
  targetId: string,
  newContent: string,
  currentUserId: string
): ThreadComment[] {
  const trimmed = newContent.trim();
  const normalizedUserId = currentUserId.trim();
  if (!trimmed || !normalizedUserId) {
    return comments;
  }

  return comments.map((comment) => {
    if (comment.id === targetId) {
      if (
        comment.author.id !== normalizedUserId ||
        comment.content === trimmed
      ) {
        return comment;
      }
      return {
        ...comment,
        content: trimmed,
        isEdited: true,
      };
    }

    const hasMatchingReply = comment.replies.some((r) => r.id === targetId);
    if (!hasMatchingReply) {
      return comment;
    }

    return {
      ...comment,
      replies: comment.replies.map((reply) => {
        if (reply.id !== targetId) {
          return reply;
        }
        if (
          reply.author.id !== normalizedUserId ||
          reply.content === trimmed
        ) {
          return reply;
        }
        return {
          ...reply,
          content: trimmed,
          isEdited: true,
        };
      }),
    };
  });
}

export function deleteCommentOrReply(
  comments: ThreadComment[],
  targetId: string,
  currentUserId: string
): ThreadComment[] {
  const normalizedUserId = currentUserId.trim();
  if (!normalizedUserId) {
    return comments;
  }

  const topLevelTarget = comments.find((c) => c.id === targetId);
  if (topLevelTarget) {
    if (topLevelTarget.author.id !== normalizedUserId) {
      return comments;
    }
    return comments.filter((c) => c.id !== targetId);
  }

  return comments.map((comment) => {
    const replyTarget = comment.replies.find((r) => r.id === targetId);
    if (!replyTarget || replyTarget.author.id !== normalizedUserId) {
      return comment;
    }

    return {
      ...comment,
      replies: comment.replies.filter((r) => r.id !== targetId),
    };
  });
}

export function editBoardPost(
  posts: BoardPostSummary[],
  targetId: string,
  newContent: string,
  currentUserId: string
): BoardPostSummary[] {
  const trimmed = newContent.trim();
  const normalizedUserId = currentUserId.trim();
  if (!trimmed || !normalizedUserId) {
    return posts;
  }

  return posts.map((post) => {
    if (post.id !== targetId) {
      return post;
    }
    if (post.authorId !== normalizedUserId || post.content === trimmed) {
      return post;
    }
    return {
      ...post,
      content: trimmed,
      isEdited: true,
    };
  });
}

export function deleteBoardPost(
  posts: BoardPostSummary[],
  targetId: string,
  currentUserId: string
): BoardPostSummary[] {
  const normalizedUserId = currentUserId.trim();
  if (!normalizedUserId) {
    return posts;
  }

  const target = posts.find((p) => p.id === targetId);
  if (!target || target.authorId !== normalizedUserId) {
    return posts;
  }

  return posts.filter((p) => p.id !== targetId);
}

export function sortComments(
  comments: ThreadComment[],
  order: CommentSortOrder
): ThreadComment[] {
  return [...comments].sort((a, b) => {
    const parsedA = Date.parse(a.createdAt);
    const parsedB = Date.parse(b.createdAt);
    const timeA = Number.isNaN(parsedA) ? 0 : parsedA;
    const timeB = Number.isNaN(parsedB) ? 0 : parsedB;
    if (order === 'newest') {
      return timeB - timeA;
    }
    return timeA - timeB;
  });
}

export function countTotalComments(comments: ThreadComment[]): number {
  return comments.reduce(
    (sum, comment) => sum + 1 + comment.replies.length,
    0
  );
}

export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const MAX_RELATIVE_DAYS = 7;
export const TIME_REFRESH_INTERVAL_MS = MINUTE_MS;

export function formatRelativeTimeThai(
  dateString: string,
  now: number | Date = Date.now()
): string {
  const nowMs = typeof now === 'number' ? now : now.getTime();
  const itemTime = Date.parse(dateString);

  if (Number.isNaN(itemTime) || Number.isNaN(nowMs)) {
    return 'ไม่ระบุเวลา';
  }

  const diffMs = Math.max(0, nowMs - itemTime);
  const diffMinutes = Math.floor(diffMs / MINUTE_MS);
  const diffHours = Math.floor(diffMs / HOUR_MS);
  const diffDays = Math.floor(diffMs / DAY_MS);

  if (diffMinutes < 1) {
    return 'เมื่อสักครู่';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} นาที ที่แล้ว`;
  }
  if (diffHours < 24) {
    return `${diffHours} ชม. ที่แล้ว`;
  }
  if (diffDays < MAX_RELATIVE_DAYS) {
    return `${diffDays} วัน ที่แล้ว`;
  }
  return new Date(itemTime).toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
  });
}

export type { BoardMembershipStatus, RoomBoardMembershipState };

export function getInitialBoardMembership(
  room: { id: string; members: number },
  joinedRoomIds: readonly string[]
): RoomBoardMembershipState {
  const isJoined = joinedRoomIds.includes(room.id);
  return {
    status: isJoined ? 'joined' : 'none',
    memberCount: Math.max(0, room.members),
  };
}

export function joinBoardRoom(
  state: RoomBoardMembershipState,
  isPrivate?: boolean
): RoomBoardMembershipState {
  if (state.status === 'joined') {
    return state;
  }
  if (isPrivate) {
    return {
      ...state,
      status: 'requested',
    };
  }
  return {
    status: 'joined',
    memberCount: state.memberCount + 1,
  };
}

export function leaveBoardRoom(
  state: RoomBoardMembershipState
): RoomBoardMembershipState {
  if (state.status === 'joined') {
    return {
      status: 'none',
      memberCount: Math.max(0, state.memberCount - 1),
    };
  }
  return {
    ...state,
    status: 'none',
  };
}

export function groupRepliesIntoBranches(
  replies: ThreadReply[],
  topCommentAuthorName: string
): ThreadBranch[] {
  const branches: ThreadBranch[] = [];

  for (const reply of replies) {
    const isNested = Boolean(
      reply.replyTo?.isNested ||
      (reply.replyTo && reply.replyTo.name !== topCommentAuthorName)
    );

    if (!isNested || branches.length === 0) {
      branches.push({
        parent: reply,
        children: [],
      });
      continue;
    }

    // Match this nested reply to its parent branch:
    // 1. By direct reply/comment ID (matches branch parent or any child already in the branch)
    let targetBranch = reply.replyTo?.id
      ? branches.find(
        (b) =>
          b.parent.id === reply.replyTo?.id ||
          b.children.some((c) => c.id === reply.replyTo?.id)
      )
      : undefined;

    // 2. By author ID (if replyTo.id was user/author id)
    if (!targetBranch && reply.replyTo?.id) {
      targetBranch = [...branches].reverse().find(
        (b) =>
          b.parent.author.id === reply.replyTo?.id ||
          b.children.some((c) => c.author.id === reply.replyTo?.id)
      );
    }

    // 3. By author name (most recent branch matching the author name)
    if (!targetBranch && reply.replyTo?.name) {
      targetBranch = [...branches].reverse().find(
        (b) =>
          b.parent.author.name === reply.replyTo?.name ||
          b.children.some((c) => c.author.name === reply.replyTo?.name)
      );
    }

    // 4. Fallback: attach to latest branch if no specific branch matched
    if (targetBranch) {
      targetBranch.children.push(reply);
    } else {
      branches[branches.length - 1].children.push(reply);
    }
  }

  return branches;
}

