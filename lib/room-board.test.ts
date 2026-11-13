import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  aggregateReactions,
  canMemberEditPostInRoom,
  canMemberPostInRoom,
  DEFAULT_ROOM_RULES,
  getStartOfBangkokDay,
  isUuid,
  mapDbMembershipToBoardState,
  mapDbPostToBoardPost,
  mapDbRoomToBoardRoom,
  MAX_POST_CONTENT_LENGTH,
  parseRoomRules,
  resolveAuthorAlias,
  resolveRoomLookupTarget,
  validatePostContent,
} from './room-board.ts';

describe('room-board domain & DB mapping', () => {
  it('validates standard UUID strings and rejects non-UUID slugs', () => {
    assert.equal(isUuid('22222222-2222-4222-8222-222222222222'), true);
    assert.equal(isUuid('songs'), false);
    assert.equal(isUuid(''), false);
  });

  it('resolves room lookup parameters to UUID, canonicalized lowercase slug, or null', () => {
    assert.deepEqual(
      resolveRoomLookupTarget('22222222-2222-4222-8222-222222222222'),
      { kind: 'id', id: '22222222-2222-4222-8222-222222222222' }
    );
    assert.deepEqual(
      resolveRoomLookupTarget('00000000-0000-0000-0000-000000000000'),
      { kind: 'id', id: '00000000-0000-0000-0000-000000000000' }
    );
    assert.deepEqual(
      resolveRoomLookupTarget('  22222222-2222-4222-8222-222222222222  '),
      { kind: 'id', id: '22222222-2222-4222-8222-222222222222' }
    );
    assert.deepEqual(resolveRoomLookupTarget('local-postgres'), {
      kind: 'slug',
      slug: 'local-postgres',
    });
    assert.deepEqual(resolveRoomLookupTarget('  Local-Postgres  '), {
      kind: 'slug',
      slug: 'local-postgres',
    });
    assert.equal(resolveRoomLookupTarget(''), null);
    assert.equal(resolveRoomLookupTarget('foo--bar'), null);
    assert.equal(resolveRoomLookupTarget('บริจาคเพลง'), null);
    assert.equal(resolveRoomLookupTarget('foo/bar'), null);
  });

  it('validates post content trimming, empty checks, and max length', () => {
    assert.deepEqual(validatePostContent('  สวัสดีครับ  '), {
      ok: true,
      value: 'สวัสดีครับ',
    });
    assert.deepEqual(validatePostContent('   \n\t  '), {
      ok: false,
      error: 'กรุณาพิมพ์ข้อความก่อนตั้งกระทู้',
    });
    const tooLong = 'ก'.repeat(MAX_POST_CONTENT_LENGTH + 1);
    assert.deepEqual(validatePostContent(tooLong), {
      ok: false,
      error: `เนื้อหากระทู้ยาวเกินไป (สูงสุด ${MAX_POST_CONTENT_LENGTH} ตัวอักษร)`,
    });
  });

  it('enforces Option A membership gating for posting in a room', () => {
    assert.deepEqual(
      canMemberPostInRoom({ isLocked: false, memberStatus: 'active' }),
      { ok: true }
    );
    assert.deepEqual(
      canMemberPostInRoom({ isLocked: false, memberStatus: 'left' }),
      { ok: false, error: 'กรุณาเข้าร่วมห้องก่อนตั้งกระทู้' }
    );
    assert.deepEqual(
      canMemberPostInRoom({ isLocked: false, memberStatus: null }),
      { ok: false, error: 'กรุณาเข้าร่วมห้องก่อนตั้งกระทู้' }
    );
    assert.deepEqual(
      canMemberPostInRoom({ isLocked: false, memberStatus: undefined }),
      { ok: false, error: 'กรุณาเข้าร่วมห้องก่อนตั้งกระทู้' }
    );
    assert.deepEqual(
      canMemberPostInRoom({ isLocked: true, memberStatus: 'active' }),
      {
        ok: false,
        error: 'ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถตั้งกระทู้ใหม่ได้',
      }
    );
    assert.deepEqual(
      canMemberPostInRoom({ isLocked: false, memberStatus: 'muted' }),
      {
        ok: false,
        error: 'คุณถูกจำกัดสิทธิ์การโพสต์ในห้องนี้ชั่วคราว',
      }
    );
    assert.deepEqual(
      canMemberPostInRoom({ isLocked: false, memberStatus: 'banned' }),
      {
        ok: false,
        error: 'คุณถูกระงับสิทธิ์การใช้งานในห้องนี้',
      }
    );
  });

  it('parses custom room rules and falls back to default rules when empty', () => {
    assert.deepEqual(
      parseRoomRules('1. กติกาข้อแรก\n2. กติกาข้อสอง\n\n3) กติกาข้อสาม'),
      ['กติกาข้อแรก', 'กติกาข้อสอง', 'กติกาข้อสาม']
    );
    assert.deepEqual(parseRoomRules(null), [...DEFAULT_ROOM_RULES]);
    assert.deepEqual(parseRoomRules('   '), [...DEFAULT_ROOM_RULES]);
  });

  it('resolves author display alias with fallback to นิรนาม', () => {
    assert.equal(
      resolveAuthorAlias({
        id: 'u1',
        username: 'user_1',
        displayUsername: 'ปลาทู',
        name: 'Platoo',
      }),
      'ปลาทู'
    );
    assert.equal(
      resolveAuthorAlias({
        id: 'u2',
        username: 'user_2',
        displayUsername: null,
        name: 'ต้นหอม',
      }),
      'ต้นหอม'
    );
    assert.equal(resolveAuthorAlias(null), 'นิรนาม');
  });

  it('aggregates DB reaction rows by emoji and marks reactedByMe for current user', () => {
    const rows = [
      { emojiType: '🫂', userId: 'u1' },
      { emojiType: '🫂', userId: 'u2' },
      { emojiType: '😭', userId: 'u3' },
    ];
    assert.deepEqual(aggregateReactions(rows, 'u2'), [
      { emoji: '🫂', count: 2, reactedByMe: true },
      { emoji: '😭', count: 1, reactedByMe: false },
    ]);
  });

  it('maps DB room, membership, and post records to RoomBoard UI models', () => {
    const nowMs = Date.parse('2026-11-13T12:00:00.000Z');
    const room = mapDbRoomToBoardRoom(
      {
        id: '22222222-2222-4222-8222-222222222222',
        slug: 'r-123456',
        name: 'บริจาคเพลง',
        description: 'ห้องเพลงเศร้า',
        rules: '1. แปะชื่อเพลง\n2. สุภาพต่อกัน',
        passwordHash: null,
        isLocked: false,
        createdAt: new Date('2026-11-12T12:00:00.000Z'),
        memberCount: 5,
        postsToday: 3,
      },
      nowMs
    );
    assert.equal(room.id, '22222222-2222-4222-8222-222222222222');
    assert.equal(room.slug, 'r-123456');
    assert.equal(room.isPrivate, false);
    assert.equal(room.isNew, true);
    assert.equal(room.members, 5);
    assert.equal(room.postsToday, 3);
    assert.deepEqual(room.rulesList, ['แปะชื่อเพลง', 'สุภาพต่อกัน']);

    assert.deepEqual(mapDbMembershipToBoardState(5, 'active'), {
      status: 'joined',
      memberCount: 5,
    });
    assert.deepEqual(mapDbMembershipToBoardState(5, 'left'), {
      status: 'none',
      memberCount: 5,
    });

    const post = mapDbPostToBoardPost(
      {
        id: '44444444-4444-4444-8444-444444444441',
        roomId: room.id,
        content: 'แนะนำเพลงหน่อยครับ',
        createdAt: new Date('2026-11-13T11:45:00.000Z'),
        authorId: 'u1',
        author: {
          id: 'u1',
          username: 'puayleng',
          displayUsername: 'ปวยเล้ง',
          name: 'Puayleng',
        },
        reactions: [{ emojiType: '🫂', userId: 'u1' }],
        replyCount: 4,
      },
      'u1',
      nowMs
    );
    assert.equal(post.author, 'ปวยเล้ง');
    assert.equal(post.timeLabel, '15 นาที ที่แล้ว');
    assert.equal(post.replyCount, 4);
    assert.deepEqual(post.reactions, [
      { emoji: '🫂', count: 1, reactedByMe: true },
    ]);
  });

  it('computes start of current day in Asia/Bangkok timezone (UTC+7)', () => {
    // 2026-11-13 02:30 ICT == 2026-11-12 19:30 UTC -> Bangkok day start is 2026-11-12 17:00:00Z
    const earlyMorningBangkok = Date.parse('2026-11-12T19:30:00.000Z');
    assert.equal(
      getStartOfBangkokDay(earlyMorningBangkok).toISOString(),
      '2026-11-12T17:00:00.000Z'
    );

    // 2026-11-13 10:00 ICT == 2026-11-13 03:00 UTC -> Bangkok day start is 2026-11-12 17:00:00Z
    const lateMorningBangkok = Date.parse('2026-11-13T03:00:00.000Z');
    assert.equal(
      getStartOfBangkokDay(lateMorningBangkok).toISOString(),
      '2026-11-12T17:00:00.000Z'
    );
  });

  it('blocks muted or banned room members from editing posts', () => {
    assert.deepEqual(
      canMemberEditPostInRoom({ isLocked: false, memberStatus: 'active' }),
      { ok: true }
    );
    assert.deepEqual(
      canMemberEditPostInRoom({ isLocked: false, memberStatus: 'muted' }),
      { ok: false, error: 'คุณถูกจำกัดสิทธิ์การแก้ไขโพสต์ในห้องนี้ชั่วคราว' }
    );
    assert.deepEqual(
      canMemberEditPostInRoom({ isLocked: false, memberStatus: 'banned' }),
      { ok: false, error: 'คุณถูกระงับสิทธิ์การใช้งานในห้องนี้' }
    );
    assert.deepEqual(
      canMemberEditPostInRoom({ isLocked: true, memberStatus: 'active' }),
      { ok: false, error: 'ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถแก้ไขกระทู้ได้' }
    );
  });
});
