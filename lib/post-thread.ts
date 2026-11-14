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

/**
 * Applies an explicit desired reaction state (`active`) for `emoji` without
 * double-flipping if the UI list is already in that state.
 */
export function applyReactionActiveState(
  reactions: readonly ReactionItem[],
  emoji: string,
  active: boolean
): ReactionItem[] {
  const normalized = emoji.trim();
  if (!normalized) {
    return reactions as ReactionItem[];
  }
  const existing = reactions.find((item) => item.emoji === normalized);
  const currentlyActive = Boolean(existing?.reactedByMe);
  if (currentlyActive === active) {
    return reactions as ReactionItem[];
  }
  return toggleReaction([...reactions], normalized);
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
  postAuthorId?: string,
  tempId?: string
): ThreadComment[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return comments;
  }

  const timeSeed = Date.parse(nowIso) || Date.now();
  const newComment: ThreadComment = {
    id: tempId ?? `comment-${timeSeed}-${comments.length + 1}`,
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
  replyTo?: { id?: string; name: string; isNested?: boolean },
  tempId?: string
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
      id: tempId ?? `reply-${timeSeed}-${comment.replies.length + 1}`,
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

export interface ReconcileReactionsInput {
  current: readonly ReactionItem[];
  serverReactions: readonly ReactionItem[];
  toggledEmoji: string;
  pendingEmojis: ReadonlySet<string>;
  applyExternalUpdates: boolean;
}

/**
 * Merges a server reaction snapshot back into optimistic UI state without wiping
 * concurrent in-flight toggles or letting stale out-of-order responses overwrite
 * newer updates, while preserving existing pill order to prevent UI jumping.
 */
export function reconcileReactions(input: ReconcileReactionsInput): ReactionItem[] {
  const {
    current,
    serverReactions,
    pendingEmojis,
    applyExternalUpdates,
  } = input;
  const toggledEmoji = input.toggledEmoji.trim();

  const serverByEmoji = new Map<string, ReactionItem>();
  for (const item of serverReactions) {
    const emoji = item.emoji.trim();
    if (!emoji) continue;
    serverByEmoji.set(emoji, {
      emoji,
      count: item.count,
      reactedByMe: Boolean(item.reactedByMe),
    });
  }

  const result: ReactionItem[] = [];
  const seen = new Set<string>();

  for (const item of current) {
    seen.add(item.emoji);

    if (pendingEmojis.has(item.emoji)) {
      result.push(item);
      continue;
    }

    if (item.emoji === toggledEmoji || applyExternalUpdates) {
      const serverItem = serverByEmoji.get(item.emoji);
      if (serverItem) {
        result.push(serverItem);
      }
      continue;
    }

    result.push(item);
  }

  if (applyExternalUpdates) {
    for (const [emoji, serverItem] of serverByEmoji) {
      if (!seen.has(emoji) && !pendingEmojis.has(emoji)) {
        result.push(serverItem);
      }
    }
  } else if (
    toggledEmoji &&
    !seen.has(toggledEmoji) &&
    !pendingEmojis.has(toggledEmoji)
  ) {
    const serverToggled = serverByEmoji.get(toggledEmoji);
    if (serverToggled) {
      result.push(serverToggled);
    }
  }

  return result;
}

export interface ReactionSyncRequest {
  seq: number;
  active: boolean;
}

export interface ReactionEnqueueResult {
  desiredActive: boolean;
  dispatch: ReactionSyncRequest | null;
}

export interface ReactionSettleResult {
  nextRequest: ReactionSyncRequest | null;
  pendingEmojis: Set<string>;
  applyExternalUpdates: boolean;
}

export interface ReactionFailResult {
  rollbackActive: boolean;
  rollbackReaction?: ReactionItem | null;
}

export interface ReactionMutationTracker {
  enqueue: (
    targetId: string,
    emoji: string,
    currentReactions: readonly ReactionItem[]
  ) => ReactionEnqueueResult | null;
  settle: (
    targetId: string,
    emoji: string,
    seq: number,
    serverReactions?: readonly ReactionItem[]
  ) => ReactionSettleResult | null;
  fail: (
    targetId: string,
    emoji: string,
    seq: number
  ) => ReactionFailResult | null;
  getCurrentEpoch: () => number;
  getPendingEmojis: (targetId: string) => ReadonlySet<string>;
  getProtectedEmojisSince: (
    targetId: string,
    sinceEpoch: number
  ) => ReadonlySet<string>;
}

function cloneReactionItem(item: ReactionItem): ReactionItem {
  return {
    emoji: item.emoji.trim(),
    count: item.count,
    reactedByMe: Boolean(item.reactedByMe),
  };
}

/**
 * Coordinates concurrent optimistic emoji updates and rapid repeated clicks on
 * the same emoji using a per-(targetId, emoji) latest-intent coalescing loop.
 */
export function createReactionMutationTracker(): ReactionMutationTracker {
  interface EmojiSyncState {
    desiredActive: boolean;
    settledActive: boolean;
    settledReaction?: ReactionItem | null;
    inFlight: ReactionSyncRequest;
  }

  let nextSeq = 1;
  const inFlightByTarget = new Map<string, Map<string, EmojiSyncState>>();
  const lastAppliedSeqByTarget = new Map<string, number>();
  const lastChangedEpochByTarget = new Map<string, Map<string, number>>();

  function recordEmojiActivity(targetId: string, key: string, epoch: number) {
    let targetEpochs = lastChangedEpochByTarget.get(targetId);
    if (!targetEpochs) {
      targetEpochs = new Map<string, number>();
      lastChangedEpochByTarget.set(targetId, targetEpochs);
    }
    targetEpochs.set(key, epoch);
  }

  function getOrCreateTargetMap(targetId: string) {
    let targetMap = inFlightByTarget.get(targetId);
    if (!targetMap) {
      targetMap = new Map<string, EmojiSyncState>();
      inFlightByTarget.set(targetId, targetMap);
    }
    return targetMap;
  }

  function deleteEntry(targetId: string, key: string) {
    const targetMap = inFlightByTarget.get(targetId);
    if (!targetMap) return;
    targetMap.delete(key);
    if (targetMap.size === 0) {
      inFlightByTarget.delete(targetId);
    }
  }

  function enqueue(
    targetId: string,
    emoji: string,
    currentReactions: readonly ReactionItem[]
  ): ReactionEnqueueResult | null {
    const key = emoji.trim();
    if (!key) return null;

    const targetMap = getOrCreateTargetMap(targetId);
    const existing = targetMap.get(key);
    if (existing) {
      existing.desiredActive = !existing.desiredActive;
      recordEmojiActivity(targetId, key, nextSeq++);
      return {
        desiredActive: existing.desiredActive,
        dispatch: null,
      };
    }

    const currentItem = currentReactions.find((item) => item.emoji === key);
    const wasActive = Boolean(currentItem?.reactedByMe);
    const desiredActive = !wasActive;
    const seq = nextSeq++;
    const dispatch: ReactionSyncRequest = { seq, active: desiredActive };
    targetMap.set(key, {
      desiredActive,
      settledActive: wasActive,
      settledReaction: currentItem ? cloneReactionItem(currentItem) : null,
      inFlight: dispatch,
    });
    recordEmojiActivity(targetId, key, seq);

    return {
      desiredActive,
      dispatch,
    };
  }

  function settle(
    targetId: string,
    emoji: string,
    seq: number,
    serverReactions?: readonly ReactionItem[]
  ): ReactionSettleResult | null {
    const key = emoji.trim();
    const targetMap = inFlightByTarget.get(targetId);
    const entry = targetMap?.get(key);
    if (!entry || entry.inFlight.seq !== seq) {
      return null;
    }

    entry.settledActive = entry.inFlight.active;
    if (serverReactions) {
      const serverItem = serverReactions.find(
        (item) => item.emoji.trim() === key
      );
      entry.settledReaction = serverItem ? cloneReactionItem(serverItem) : null;
    }
    recordEmojiActivity(targetId, key, nextSeq++);

    const prevApplied = lastAppliedSeqByTarget.get(targetId) ?? 0;
    const applyExternalUpdates = seq >= prevApplied;
    if (applyExternalUpdates) {
      lastAppliedSeqByTarget.set(targetId, seq);
    }

    if (entry.desiredActive !== entry.settledActive) {
      const nextRequest: ReactionSyncRequest = {
        seq: nextSeq++,
        active: entry.desiredActive,
      };
      entry.inFlight = nextRequest;
      return {
        nextRequest,
        pendingEmojis: new Set(targetMap?.keys() ?? []),
        applyExternalUpdates,
      };
    }

    deleteEntry(targetId, key);
    return {
      nextRequest: null,
      pendingEmojis: new Set(inFlightByTarget.get(targetId)?.keys() ?? []),
      applyExternalUpdates,
    };
  }

  function fail(
    targetId: string,
    emoji: string,
    seq: number
  ): ReactionFailResult | null {
    const key = emoji.trim();
    const entry = inFlightByTarget.get(targetId)?.get(key);
    if (!entry || entry.inFlight.seq !== seq) {
      return null;
    }

    const rollbackActive = entry.settledActive;
    const rollbackReaction = entry.settledReaction;
    recordEmojiActivity(targetId, key, nextSeq++);
    deleteEntry(targetId, key);
    return { rollbackActive, rollbackReaction };
  }

  function getCurrentEpoch(): number {
    return nextSeq;
  }

  function getPendingEmojis(targetId: string): ReadonlySet<string> {
    return new Set(inFlightByTarget.get(targetId)?.keys() ?? []);
  }

  function getProtectedEmojisSince(
    targetId: string,
    sinceEpoch: number
  ): ReadonlySet<string> {
    const protectedSet = new Set<string>(
      inFlightByTarget.get(targetId)?.keys() ?? []
    );
    const targetEpochs = lastChangedEpochByTarget.get(targetId);
    if (targetEpochs) {
      for (const [emojiKey, epoch] of targetEpochs) {
        if (epoch >= sinceEpoch) {
          protectedSet.add(emojiKey);
        }
      }
    }
    return protectedSet;
  }

  return {
    enqueue,
    settle,
    fail,
    getCurrentEpoch,
    getPendingEmojis,
    getProtectedEmojisSince,
  };
}

/**
 * Restores a reaction pill to the last server-confirmed snapshot when available
 * so follow-up failures keep other users' counts intact.
 */
export function restoreReactionSnapshot(
  current: readonly ReactionItem[],
  emoji: string,
  rollbackActive: boolean,
  rollbackReaction?: ReactionItem | null
): ReactionItem[] {
  const key = emoji.trim();
  if (!key) {
    return [...current];
  }

  if (rollbackReaction === undefined) {
    return applyReactionActiveState([...current], key, rollbackActive);
  }

  const next: ReactionItem[] = [];
  let replaced = false;

  for (const item of current) {
    if (item.emoji === key) {
      if (rollbackReaction) {
        next.push(cloneReactionItem(rollbackReaction));
      }
      replaced = true;
      continue;
    }
    next.push(item);
  }

  if (!replaced && rollbackReaction) {
    next.push(cloneReactionItem(rollbackReaction));
  }

  return next;
}

type ReactionInput = {
  emoji: string;
  count: number;
  reactedByMe?: boolean;
};

function normalizeReactionList(items: readonly ReactionInput[]): ReactionItem[] {
  return items.map((item) => ({
    emoji: item.emoji.trim(),
    count: item.count,
    reactedByMe: Boolean(item.reactedByMe),
  }));
}

/**
 * Reconciles an incoming server reaction list (such as from an RSC refresh or
 * sibling comment mutation) while keeping any emojis that are still pending or
 * settled since `sinceEpoch`.
 */
export function mergeIncomingReactions(input: {
  tracker: ReactionMutationTracker;
  targetId: string;
  currentReactions: readonly ReactionInput[];
  incomingReactions: readonly ReactionInput[];
  sinceEpoch?: number;
}): ReactionItem[] {
  const pendingEmojis =
    input.sinceEpoch !== undefined
      ? input.tracker.getProtectedEmojisSince(input.targetId, input.sinceEpoch)
      : input.tracker.getPendingEmojis(input.targetId);

  const normalizedIncoming = normalizeReactionList(input.incomingReactions);
  if (pendingEmojis.size === 0) {
    return normalizedIncoming;
  }

  return reconcileReactions({
    current: normalizeReactionList(input.currentReactions),
    serverReactions: normalizedIncoming,
    toggledEmoji: '',
    pendingEmojis,
    applyExternalUpdates: true,
  });
}

/**
 * Merges a refreshed `PostThread` snapshot while preserving in-flight and
 * recently settled reactions across the root post, comments, and replies.
 */
export function mergeThreadReactions(input: {
  currentThread: PostThread;
  incomingThread: PostThread;
  tracker: ReactionMutationTracker;
  sinceEpoch: number;
}): PostThread {
  const currentReactionsById = new Map<string, readonly ReactionItem[]>();
  for (const comment of input.currentThread.comments) {
    currentReactionsById.set(comment.id, comment.reactions);
    for (const reply of comment.replies) {
      currentReactionsById.set(reply.id, reply.reactions);
    }
  }

  return {
    ...input.incomingThread,
    reactions: mergeIncomingReactions({
      tracker: input.tracker,
      targetId: input.incomingThread.id,
      currentReactions: input.currentThread.reactions,
      incomingReactions: input.incomingThread.reactions,
      sinceEpoch: input.sinceEpoch,
    }),
    comments: input.incomingThread.comments.map((comment) => ({
      ...comment,
      reactions: mergeIncomingReactions({
        tracker: input.tracker,
        targetId: comment.id,
        currentReactions: currentReactionsById.get(comment.id) ?? [],
        incomingReactions: comment.reactions,
        sinceEpoch: input.sinceEpoch,
      }),
      replies: comment.replies.map((reply) => ({
        ...reply,
        reactions: mergeIncomingReactions({
          tracker: input.tracker,
          targetId: reply.id,
          currentReactions: currentReactionsById.get(reply.id) ?? [],
          incomingReactions: reply.reactions,
          sinceEpoch: input.sinceEpoch,
        }),
      })),
    })),
  };
}

/**
 * Copies latest reaction arrays from surviving comments/replies back onto a
 * pre-mutation snapshot when rolling back a failed delete operation.
 */
export function preserveCommentReactions(
  targetComments: readonly ThreadComment[],
  currentComments: readonly ThreadComment[]
): ThreadComment[] {
  const currentReactionsById = new Map<string, ReactionItem[]>();
  for (const comment of currentComments) {
    currentReactionsById.set(comment.id, comment.reactions);
    for (const reply of comment.replies) {
      currentReactionsById.set(reply.id, reply.reactions);
    }
  }

  return targetComments.map((comment) => ({
    ...comment,
    reactions: currentReactionsById.get(comment.id) ?? comment.reactions,
    replies: comment.replies.map((reply) => ({
      ...reply,
      reactions: currentReactionsById.get(reply.id) ?? reply.reactions,
    })),
  }));
}

export function revertEditedCommentContent(
  comments: readonly ThreadComment[],
  targetId: string,
  original: { content: string; isEdited?: boolean }
): ThreadComment[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return {
        ...comment,
        content: original.content,
        isEdited: original.isEdited,
      };
    }

    if (!comment.replies.some((reply) => reply.id === targetId)) {
      return comment;
    }

    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === targetId
          ? {
              ...reply,
              content: original.content,
              isEdited: original.isEdited,
            }
          : reply
      ),
    };
  });
}

export function removeOptimisticCommentOrReply(
  comments: readonly ThreadComment[],
  tempId: string
): ThreadComment[] {
  return comments
    .filter((comment) => comment.id !== tempId)
    .map((comment) =>
      comment.replies.some((reply) => reply.id === tempId)
        ? {
            ...comment,
            replies: comment.replies.filter((reply) => reply.id !== tempId),
          }
        : comment
    );
}


