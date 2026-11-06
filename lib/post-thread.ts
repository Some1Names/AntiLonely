import type {
  CommentSortOrder,
  PostThread,
  ReactionItem,
  ThreadAuthor,
  ThreadComment,
  ThreadReply,
} from '@/types/post-thread';

export const PRESET_REACTION_EMOJIS: readonly string[] = [
  '😣',
  '😭',
  '😢',
  '😂',
  '🤩',
  '❤️',
  '👍',
  '🔥',
];

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
  replyTo?: { id?: string; name: string }
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
    const newReply: ThreadReply = {
      id: `reply-${timeSeed}-${comment.replies.length + 1}`,
      author,
      ...(replyTo ? { replyTo } : {}),
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
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) {
    return 'เมื่อสักครู่';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} นาที ที่แล้ว`;
  }
  if (diffHours < 24) {
    return `${diffHours} ชม. ที่แล้ว`;
  }
  if (diffDays < 7) {
    return `${diffDays} วัน ที่แล้ว`;
  }
  return new Date(itemTime).toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
  });
}
