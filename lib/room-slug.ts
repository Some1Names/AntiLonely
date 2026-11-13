import { createHash, randomInt } from 'node:crypto';
import {
  isUuidString,
  isValidRoomSlug,
  RESERVED_ROOM_SLUGS,
  ROOM_SLUG_COLLISION_SUFFIX_LENGTH,
  ROOM_SLUG_FALLBACK_CODE_LENGTH,
  ROOM_SLUG_MAX_BASE_LENGTH,
} from './room-slug-validation.ts';

export {
  isUuidString,
  isValidRoomSlug,
  RESERVED_ROOM_SLUGS,
  ROOM_SLUG_COLLISION_SUFFIX_LENGTH,
  ROOM_SLUG_FALLBACK_CODE_LENGTH,
  ROOM_SLUG_MAX_BASE_LENGTH,
};

const ALPHANUMERIC_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

function deterministicCode(seedKey: string, length: number): string {
  return createHash('sha256')
    .update(seedKey, 'utf8')
    .digest('hex')
    .slice(0, length);
}

function randomCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHANUMERIC_CHARS[randomInt(0, ALPHANUMERIC_CHARS.length)];
  }
  return out;
}

/**
 * Generates an automatic lowercase ASCII slug from a room name, falling back to `r-<6char>`
 * for pure non-ASCII, too-short, reserved, or UUID-like results.
 */
export function buildRoomSlug(
  name: string,
  options?: { deterministicKey?: string }
): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, ROOM_SLUG_MAX_BASE_LENGTH)
    .replace(/-+$/g, '');

  if (
    base.length >= 2 &&
    !RESERVED_ROOM_SLUGS.has(base) &&
    !isUuidString(base)
  ) {
    return base;
  }

  const key = options?.deterministicKey;
  const shortCode = key
    ? deterministicCode(key, ROOM_SLUG_FALLBACK_CODE_LENGTH)
    : randomCode(ROOM_SLUG_FALLBACK_CODE_LENGTH);

  return `r-${shortCode}`;
}

/**
 * Resolves a unique slug using `slugExists` collision checks, appending `-<4char>` suffixes on conflicts.
 */
export async function resolveUniqueRoomSlug(
  name: string,
  slugExists: (candidate: string) => Promise<boolean> | boolean,
  options?: { deterministicKey?: string; maxAttempts?: number }
): Promise<string> {
  const deterministicKey = options?.deterministicKey;
  const maxAttempts = options?.maxAttempts ?? 10;
  const baseCandidate = buildRoomSlug(name, { deterministicKey });

  if (!(await slugExists(baseCandidate))) {
    return baseCandidate;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const suffix = deterministicKey
      ? deterministicCode(
          `${deterministicKey}:${attempt}`,
          ROOM_SLUG_COLLISION_SUFFIX_LENGTH
        )
      : randomCode(ROOM_SLUG_COLLISION_SUFFIX_LENGTH);
    const candidate = `${baseCandidate}-${suffix}`;
    if (!(await slugExists(candidate))) {
      return candidate;
    }
  }

  throw new Error('Unable to allocate unique room slug');
}
