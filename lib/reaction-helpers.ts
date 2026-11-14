import { EMOJI_CATALOG } from './emoji-catalog.ts';
import { PRESET_REACTION_EMOJIS } from './post-thread.ts';
import { isMessageInPostSubtree } from './post-thread-mapper.ts';
import {
  aggregateReactions,
  canMemberReactInRoom,
  isUuid,
  type DbMemberStatus,
  type DbReactionRow,
} from './room-board.ts';
import type { ReactionItem } from '../types/post-thread.ts';

const SUPPORTED_REACTION_EMOJIS = new Set<string>([
  ...PRESET_REACTION_EMOJIS,
  ...Object.keys(EMOJI_CATALOG),
]);

export function isSupportedReactionEmoji(emoji: string): boolean {
  const trimmed = emoji.trim();
  return Boolean(trimmed && trimmed.length <= 32 && SUPPORTED_REACTION_EMOJIS.has(trimmed));
}

export interface AncestryNode {
  id: string;
  roomId: string;
  parentId: string | null;
  status: 'visible' | 'hidden' | 'deleted';
  parent?: AncestryNode | null;
}

/**
 * Verifies whether a message belongs to a post's visible subtree using nested
 * parent links loaded in a single indexed query, requesting a full fallback scan
 * only if nesting exceeds the loaded parent depth.
 */
export function resolveThreadAncestryStatus(input: {
  postId: string;
  target: AncestryNode | null;
  hasActiveRootPost: boolean;
}): 'valid' | 'not_found' | 'needs_fallback' {
  const { postId, target, hasActiveRootPost } = input;
  if (!hasActiveRootPost || !target || target.status !== 'visible') {
    return 'not_found';
  }

  if (target.id === postId) {
    return target.parentId === null ? 'valid' : 'not_found';
  }

  const visited = new Set<string>();
  let current: AncestryNode | null | undefined = target;

  while (current) {
    if (visited.has(current.id)) return 'not_found';
    visited.add(current.id);

    if (current.status !== 'visible' || current.roomId !== target.roomId) {
      return 'not_found';
    }
    if (!current.parentId) {
      return 'not_found';
    }
    if (current.parentId === postId) {
      return 'valid';
    }
    if (!current.parent) {
      return 'needs_fallback';
    }
    current = current.parent;
  }

  return 'not_found';
}

export interface ToggleReactionStoreDeps<Row> {
  deleteMany: () => Promise<{ count: number }>;
  create: () => Promise<unknown>;
  findMany: () => Promise<Row[]>;
  isUniqueViolation: (error: unknown) => boolean;
}

/**
 * Applies a reaction mutation with an optional explicit desired state (`active`).
 * Skipping the opposite write step avoids redundant DB round-trips and toggle parity races.
 */
export async function applyReactionWithStore<Row>(
  deps: ToggleReactionStoreDeps<Row> & { desiredActive?: boolean }
): Promise<Row[]> {
  if (deps.desiredActive === true) {
    try {
      await deps.create();
    } catch (error) {
      if (!deps.isUniqueViolation(error)) {
        throw error;
      }
    }
    return deps.findMany();
  }

  if (deps.desiredActive === false) {
    await deps.deleteMany();
    return deps.findMany();
  }

  return toggleReactionWithStore(deps);
}

/**
 * Toggles a user's reaction row without opening a multi-round-trip database
 * transaction, relying on the (messageId, userId, emojiType) unique constraint.
 * Prefer `applyReactionWithStore` with an explicit `desiredActive` for interactive clicks.
 */
export async function toggleReactionWithStore<Row>(
  deps: ToggleReactionStoreDeps<Row>
): Promise<Row[]> {
  const deleted = await deps.deleteMany();

  if (deleted.count === 0) {
    try {
      await deps.create();
    } catch (error) {
      if (!deps.isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  return deps.findMany();
}

/**
 * Rejects cross-origin POST requests via Origin + host comparison and Sec-Fetch-Site
 * checks, matching Next.js Server Action same-origin CSRF protection.
 */
export function isSameOriginMutationRequest(input: {
  originHeader: string | null;
  hostHeader: string | null;
  forwardedHostHeader?: string | null;
  secFetchSiteHeader?: string | null;
}): boolean {
  const origin = input.originHeader?.trim();
  const secFetchSite = input.secFetchSiteHeader?.trim().toLowerCase();

  if (!origin) {
    return !secFetchSite || secFetchSite === 'same-origin';
  }
  if (origin === 'null') {
    return false;
  }

  if (secFetchSite && secFetchSite !== 'same-origin') {
    return false;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }

  const forwardedHost = input.forwardedHostHeader
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  const host = input.hostHeader?.trim().toLowerCase();
  const expectedHost = forwardedHost || host;

  if (!expectedHost) {
    return false;
  }

  return originHost === expectedHost;
}

export function isJsonMutationContentType(contentTypeHeader: string | null): boolean {
  if (!contentTypeHeader) {
    return false;
  }
  const mediaType = contentTypeHeader.split(';')[0]?.trim().toLowerCase();
  return mediaType === 'application/json';
}

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

export interface ReactionContextSnapshot {
  hasActiveSanction: boolean;
  room: {
    id: string;
    slug: string;
    status: string;
    isPrivate: boolean;
  } | null;
  memberStatus: DbMemberStatus | null;
  hasActiveRootPost: boolean;
  target: AncestryNode | null;
}

export interface ToggleMessageReactionDeps {
  getSessionUserId: (headers?: Headers) => Promise<string | null | undefined>;
  loadContext: (input: {
    userId: string;
    roomId: string;
    postId: string;
    messageId: string;
    isThreadMode: boolean;
  }) => Promise<ReactionContextSnapshot>;
  loadVisibleRoomReplies: (roomId: string) => Promise<
    Array<{
      id: string;
      parentId: string | null;
      status: 'visible' | 'hidden' | 'deleted';
    }>
  >;
  createStoreForMessage: (input: {
    messageId: string;
    userId: string;
    emoji: string;
  }) => ToggleReactionStoreDeps<DbReactionRow>;
}

function normalizeUuid(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return isUuid(trimmed) ? trimmed : null;
}

/**
 * Core reaction toggle workflow shared by the Next.js service and unit tests:
 * validates the emoji allowlist, enforces room membership/sanctions before
 * checking target ancestry or running room-wide scans, and mutates lock-free.
 */
export async function executeToggleMessageReaction(
  input: {
    roomId: string;
    postId?: string;
    messageId: string;
    emoji: string;
    active?: boolean;
    headers?: Headers;
  },
  deps: ToggleMessageReactionDeps
): Promise<ToggleReactionServiceResult> {
  const isThreadMode = input.postId !== undefined;
  const notFoundError = isThreadMode
    ? 'ไม่พบข้อความที่ต้องการกดรีแอคชัน'
    : 'ไม่พบกระทู้ที่ต้องการรีแอคชัน';

  const emoji = typeof input.emoji === 'string' ? input.emoji.trim() : '';
  if (!isSupportedReactionEmoji(emoji)) {
    return { ok: false, status: 400, error: 'อีโมจิไม่ถูกต้อง' };
  }

  const roomId = normalizeUuid(input.roomId);
  const messageId = normalizeUuid(input.messageId);
  const postId = isThreadMode ? normalizeUuid(input.postId) : messageId;

  if (!roomId || !messageId || !postId) {
    return { ok: false, status: 404, error: notFoundError };
  }

  const rawUserId = await deps.getSessionUserId(input.headers);
  const userId = typeof rawUserId === 'string' ? rawUserId.trim().toLowerCase() : null;
  if (!userId || !isUuid(userId)) {
    return { ok: false, status: 401, error: 'กรุณาเข้าสู่ระบบก่อนกดรีแอคชัน' };
  }

  const context = await deps.loadContext({
    userId,
    roomId,
    postId,
    messageId,
    isThreadMode,
  });

  if (context.hasActiveSanction) {
    return { ok: false, status: 401, error: 'กรุณาเข้าสู่ระบบก่อนกดรีแอคชัน' };
  }

  if (!context.room || context.room.status !== 'active') {
    return { ok: false, status: 404, error: notFoundError };
  }

  const reactPermission = canMemberReactInRoom({
    isPrivate: context.room.isPrivate,
    memberStatus: context.memberStatus,
  });
  if (!reactPermission.ok) {
    return { ok: false, status: 403, error: reactPermission.error };
  }

  if (!context.target) {
    return { ok: false, status: 404, error: notFoundError };
  }

  if (!isThreadMode) {
    if (context.target.parentId !== null) {
      return { ok: false, status: 404, error: notFoundError };
    }
  } else {
    const hasActiveRootPost =
      postId === messageId
        ? context.target.parentId === null
        : context.hasActiveRootPost;
    const ancestry = resolveThreadAncestryStatus({
      postId,
      target: context.target,
      hasActiveRootPost,
    });

    if (ancestry === 'not_found') {
      return { ok: false, status: 404, error: notFoundError };
    }

    if (ancestry === 'needs_fallback') {
      const visibleMessages = await deps.loadVisibleRoomReplies(context.room.id);
      if (!isMessageInPostSubtree(postId, messageId, visibleMessages)) {
        return { ok: false, status: 404, error: notFoundError };
      }
    }
  }

  const updatedRows = await applyReactionWithStore({
    desiredActive: input.active,
    ...deps.createStoreForMessage({
      messageId: context.target.id,
      userId,
      emoji,
    }),
  });

  return {
    ok: true,
    status: 200,
    data: {
      messageId: context.target.id,
      postId,
      roomId: context.room.id,
      roomSlug: context.room.slug,
      emoji,
      reactions: aggregateReactions(updatedRows, userId),
    },
  };
}

/**
 * Pure HTTP request handler for POST /api/reactions/toggle so validation, CSRF
 * checks, status codes, and path revalidation can be tested directly in node:test.
 */
export async function handleToggleReactionHttp(
  request: Request,
  deps: {
    toggleReaction: (input: {
      roomId: string;
      postId?: string;
      messageId: string;
      emoji: string;
      active?: boolean;
      headers?: Headers;
    }) => Promise<ToggleReactionServiceResult>;
    revalidatePath?: (path: string) => void;
  }
): Promise<{
  status: number;
  body:
    | { ok: true; data: { messageId: string; reactions: ReactionItem[] } }
    | { ok: false; error: string };
}> {
  if (
    !isSameOriginMutationRequest({
      originHeader: request.headers.get('origin'),
      hostHeader: request.headers.get('host'),
      forwardedHostHeader: request.headers.get('x-forwarded-host'),
      secFetchSiteHeader: request.headers.get('sec-fetch-site'),
    })
  ) {
    return {
      status: 403,
      body: { ok: false, error: 'คำขอไม่ได้มาจากโดเมนที่อนุญาต' },
    };
  }

  if (!isJsonMutationContentType(request.headers.get('content-type'))) {
    return {
      status: 415,
      body: { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' },
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      status: 400,
      body: { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' },
    };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      status: 400,
      body: { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' },
    };
  }

  const { roomId, postId, messageId, emoji, active } = body as {
    roomId?: unknown;
    postId?: unknown;
    messageId?: unknown;
    emoji?: unknown;
    active?: unknown;
  };

  if (
    typeof roomId !== 'string' ||
    typeof emoji !== 'string' ||
    (postId !== undefined && typeof postId !== 'string') ||
    (messageId !== undefined && typeof messageId !== 'string') ||
    (active !== undefined && typeof active !== 'boolean')
  ) {
    return {
      status: 400,
      body: { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' },
    };
  }

  const resolvedMessageId =
    typeof messageId === 'string' ? messageId : (postId ?? '');

  try {
    const result = await deps.toggleReaction({
      roomId,
      postId,
      messageId: resolvedMessageId,
      emoji,
      active,
      headers: request.headers,
    });

    if (!result.ok) {
      return {
        status: result.status,
        body: { ok: false, error: result.error },
      };
    }

    if (deps.revalidatePath) {
      const paths = [
        `/rooms/${result.data.roomSlug}`,
        `/rooms/${result.data.roomId}`,
        `/rooms/${result.data.roomSlug}/posts/${result.data.postId}`,
        `/rooms/${result.data.roomId}/posts/${result.data.postId}`,
      ];
      for (const path of paths) {
        try {
          deps.revalidatePath(path);
        } catch {
          // Ignore revalidation errors so the reaction update always returns quickly.
        }
      }
    }

    return {
      status: 200,
      body: {
        ok: true,
        data: {
          messageId: result.data.messageId,
          reactions: result.data.reactions,
        },
      },
    };
  } catch {
    return {
      status: 500,
      body: { ok: false, error: 'ไม่สามารถอัปเดตรีแอคชันได้ กรุณาลองใหม่อีกครั้ง' },
    };
  }
}
