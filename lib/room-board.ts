import type { Room } from '@/types/room';
import type {
  BoardPostSummary,
  ReactionItem,
  RoomBoardMembershipState,
} from '@/types/post-thread';
import { DAY_MS, formatRelativeTimeThai } from './post-thread.ts';
import { isUuidString, isValidRoomSlug } from './room-slug-validation.ts';

export const DEFAULT_ROOM_EMOJI = '💬';

export const DEFAULT_ROOM_RULES: readonly string[] = [
  'ใจดีต่อกัน เพราะหลังจอก็คือคนเหมือนกันน้า',
  'ไม่เปิดเผยข้อมูลส่วนตัว ทั้งของตัวเองและของคนอื่น',
  'ไม่สแปม ไม่ขายของ',
  'เจอคนไม่น่ารัก กดรายงานดีกว่าตอบโต้นะ',
];

export const MAX_POST_CONTENT_LENGTH = 5000;
export const NEW_ROOM_WINDOW_DAYS = 7;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getStartOfBangkokDay(nowMs: number = Date.now()): Date {
  const bangkokNow = new Date(nowMs + BANGKOK_OFFSET_MS);
  const utcMidnightOfBangkokDay = Date.UTC(
    bangkokNow.getUTCFullYear(),
    bangkokNow.getUTCMonth(),
    bangkokNow.getUTCDate()
  );
  return new Date(utcMidnightOfBangkokDay - BANGKOK_OFFSET_MS);
}

export function isUuid(value: string): boolean {
  return isUuidString(value);
}

export type RoomLookupTarget =
  | { kind: 'id'; id: string }
  | { kind: 'slug'; slug: string }
  | null;

/** Classifies a URL segment into a UUID lookup, canonicalized lowercase slug lookup, or null. */
export function resolveRoomLookupTarget(rawParam: string): RoomLookupTarget {
  const trimmed = rawParam.trim();
  if (!trimmed) return null;

  if (isUuid(trimmed)) {
    return { kind: 'id', id: trimmed.toLowerCase() };
  }

  const normalizedSlug = trimmed.toLowerCase();
  if (isValidRoomSlug(normalizedSlug)) {
    return { kind: 'slug', slug: normalizedSlug };
  }

  return null;
}

export function validatePostContent(
  content: string
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, error: 'กรุณาพิมพ์ข้อความก่อนตั้งกระทู้' };
  }
  if (trimmed.length > MAX_POST_CONTENT_LENGTH) {
    return {
      ok: false,
      error: `เนื้อหากระทู้ยาวเกินไป (สูงสุด ${MAX_POST_CONTENT_LENGTH} ตัวอักษร)`,
    };
  }
  return { ok: true, value: trimmed };
}

export type DbMemberStatus = 'active' | 'muted' | 'banned' | 'left';

export function canMemberPostInRoom(input: {
  isLocked: boolean;
  memberStatus: DbMemberStatus | null | undefined;
}): { ok: true } | { ok: false; error: string } {
  if (input.isLocked) {
    return {
      ok: false,
      error: 'ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถตั้งกระทู้ใหม่ได้',
    };
  }
  if (!input.memberStatus || input.memberStatus === 'left') {
    return {
      ok: false,
      error: 'กรุณาเข้าร่วมห้องก่อนตั้งกระทู้',
    };
  }
  if (input.memberStatus === 'muted') {
    return {
      ok: false,
      error: 'คุณถูกจำกัดสิทธิ์การโพสต์ในห้องนี้ชั่วคราว',
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

/** Validates whether a user may toggle post reactions in a public or private room. */
export function canMemberReactInRoom(input: {
  isPrivate: boolean;
  memberStatus: DbMemberStatus | null | undefined;
}): { ok: true } | { ok: false; error: string } {
  if (input.memberStatus === 'muted' || input.memberStatus === 'banned') {
    return {
      ok: false,
      error: 'คุณไม่มีสิทธิ์ทำรายการในห้องนี้',
    };
  }
  if (input.isPrivate && input.memberStatus !== 'active') {
    return {
      ok: false,
      error: 'เฉพาะสมาชิกของห้องส่วนตัวเท่านั้นที่สามารถกดรีแอคชันได้',
    };
  }
  return { ok: true };
}

export function canMemberEditPostInRoom(input: {
  isLocked: boolean;
  memberStatus: DbMemberStatus | null | undefined;
}): { ok: true } | { ok: false; error: string } {
  if (input.isLocked) {
    return {
      ok: false,
      error: 'ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถแก้ไขกระทู้ได้',
    };
  }
  if (input.memberStatus === 'muted') {
    return {
      ok: false,
      error: 'คุณถูกจำกัดสิทธิ์การแก้ไขโพสต์ในห้องนี้ชั่วคราว',
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

export function parseRoomRules(rules: string | null | undefined): string[] {
  if (!rules || !rules.trim()) {
    return [...DEFAULT_ROOM_RULES];
  }

  const parsed = rules
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : [...DEFAULT_ROOM_RULES];
}

export interface DbAuthorSnapshot {
  id: string;
  username: string;
  displayUsername: string | null;
  name: string;
}

export function resolveAuthorAlias(
  author: DbAuthorSnapshot | null | undefined
): string {
  if (!author) return 'นิรนาม';
  return (
    author.displayUsername?.trim() ||
    author.name?.trim() ||
    author.username?.trim() ||
    'นิรนาม'
  );
}

export interface DbReactionRow {
  emojiType: string;
  userId: string;
}

export function aggregateReactions(
  reactions: readonly DbReactionRow[],
  currentUserId?: string | null
): ReactionItem[] {
  const map = new Map<string, { count: number; reactedByMe: boolean }>();

  for (const r of reactions) {
    const emoji = r.emojiType.trim();
    if (!emoji) continue;

    const existing = map.get(emoji);
    const isMine = Boolean(currentUserId && r.userId === currentUserId);
    if (existing) {
      existing.count += 1;
      if (isMine) existing.reactedByMe = true;
    } else {
      map.set(emoji, { count: 1, reactedByMe: isMine });
    }
  }

  return Array.from(map.entries()).map(([emoji, value]) => ({
    emoji,
    count: value.count,
    reactedByMe: value.reactedByMe,
  }));
}

export interface DbRoomRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  rules: string | null;
  passwordHash: string | null;
  isLocked: boolean;
  createdAt: Date;
  memberCount: number;
  postsToday: number;
  totalPosts: number;
}

export type RoomPostCountStats = {
  totalPosts: number | null;
  postsToday: number | null;
};

/** Returns total posts (when known) and today's post count when active (> 0) or when totalPosts is unknown. */
export function resolveRoomPostCountStats(room: {
  postsToday: number;
  totalPosts?: number;
}): RoomPostCountStats {
  const today = Math.max(0, room.postsToday);
  if (room.totalPosts === undefined) {
    return { totalPosts: null, postsToday: today };
  }
  return {
    totalPosts: Math.max(0, room.totalPosts),
    postsToday: today > 0 ? today : null,
  };
}

export function mapDbRoomToBoardRoom(
  room: DbRoomRow,
  nowMs: number = Date.now()
): Room & { slug: string; totalPosts: number; rulesList: string[]; isLocked: boolean } {
  const ageMs = Math.max(0, nowMs - room.createdAt.getTime());
  const isNew = ageMs <= NEW_ROOM_WINDOW_DAYS * DAY_MS;

  return {
    id: room.id,
    slug: room.slug,
    name: room.name,
    description: room.description,
    members: Math.max(0, room.memberCount),
    postsToday: Math.max(0, room.postsToday),
    totalPosts: Math.max(0, room.totalPosts),
    isPrivate: Boolean(room.passwordHash),
    isNew,
    emoji: DEFAULT_ROOM_EMOJI,
    rulesList: parseRoomRules(room.rules),
    isLocked: room.isLocked,
  };
}

export function mapDbMembershipToBoardState(
  memberCount: number,
  memberStatus?: DbMemberStatus | null
): RoomBoardMembershipState {
  return {
    status: memberStatus === 'active' ? 'joined' : 'none',
    memberCount: Math.max(0, memberCount),
  };
}

export interface DbMessageRow {
  id: string;
  roomId: string;
  content: string;
  createdAt: Date;
  authorId: string | null;
  author: DbAuthorSnapshot | null;
  reactions: readonly DbReactionRow[];
  replyCount: number;
}

export function mapDbPostToBoardPost(
  message: DbMessageRow,
  currentUserId?: string | null,
  nowMs: number = Date.now()
): BoardPostSummary {
  const createdAtIso = message.createdAt.toISOString();
  const createdAtOffsetMs = Math.max(0, nowMs - message.createdAt.getTime());

  return {
    id: message.id,
    roomId: message.roomId,
    authorId: message.authorId ?? 'deleted-user',
    author: resolveAuthorAlias(message.author),
    createdAt: createdAtIso,
    createdAtOffsetMs,
    timeLabel: formatRelativeTimeThai(createdAtIso, nowMs),
    content: message.content,
    reactions: aggregateReactions(message.reactions, currentUserId),
    replyCount: Math.max(0, message.replyCount),
  };
}
