export const ROOM_SLUG_MAX_BASE_LENGTH = 48;
export const ROOM_SLUG_FALLBACK_CODE_LENGTH = 6;
export const ROOM_SLUG_COLLISION_SUFFIX_LENGTH = 4;

export const RESERVED_ROOM_SLUGS: ReadonlySet<string> = new Set([
  'new',
  'edit',
  'admin',
  'api',
  'login',
  'logout',
  'signup',
  'register',
  'auth',
  'rooms',
  'posts',
  'notifications',
  'profile',
  'settings',
]);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROOM_SLUG_MAX_LENGTH = 80;

/** Returns true if value matches canonical PostgreSQL UUID format. */
export function isUuidString(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/** Validates that a room slug consists only of lowercase [a-z0-9] tokens separated by single hyphens. */
export function isValidRoomSlug(value: string): boolean {
  return (
    value.length >= 1 &&
    value.length <= ROOM_SLUG_MAX_LENGTH &&
    VALID_SLUG_REGEX.test(value) &&
    !isUuidString(value)
  );
}
