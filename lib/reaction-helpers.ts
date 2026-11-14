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
 * Rejects cross-origin POST requests when an Origin header is supplied,
 * matching Next.js Server Action same-origin CSRF protection.
 */
export function isSameOriginMutationRequest(input: {
  originHeader: string | null;
  hostHeader: string | null;
  forwardedHostHeader?: string | null;
}): boolean {
  const origin = input.originHeader?.trim();
  if (!origin) {
    return true;
  }
  if (origin === 'null') {
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
