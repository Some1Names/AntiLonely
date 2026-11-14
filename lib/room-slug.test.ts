import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRoomSlug,
  isUuidString,
  isValidRoomSlug,
  RESERVED_ROOM_SLUGS,
  resolveUniqueRoomSlug,
} from './room-slug.ts';

describe('room-slug', () => {
  it('extracts lowercase hyphenated ASCII tokens from mixed Thai/English room names', () => {
    assert.equal(
      buildRoomSlug('ห้องทดลอง Local Postgres', {
        deterministicKey: '22222222-2222-4222-8222-222222222222',
      }),
      'local-postgres'
    );
    assert.equal(
      buildRoomSlug('  ACS!! Leak 2026  ', { deterministicKey: 'k1' }),
      'acs-leak-2026'
    );
  });

  it('falls back to deterministic r-<6hex> when ASCII base is empty, <2 chars, UUID-shaped, or reserved', () => {
    const keySongs = '20000000-0000-4000-8000-000000000002';
    const songsSlug = buildRoomSlug('บริจาคเพลง', {
      deterministicKey: keySongs,
    });
    assert.match(songsSlug, /^r-[a-z0-9]{6}$/);
    assert.equal(
      songsSlug,
      buildRoomSlug('บริจาคเพลง', { deterministicKey: keySongs })
    );
    assert.notEqual(
      songsSlug,
      buildRoomSlug('เม้าท์อาจารย์', {
        deterministicKey: '20000000-0000-4000-8000-000000000003',
      })
    );

    for (const edge of [
      'a',
      '---x---',
      'new',
      'signup',
      'ADMIN',
      'ห้อง api',
      '22222222-2222-4222-8222-222222222222',
      '00000000-0000-0000-0000-000000000000',
    ]) {
      assert.match(
        buildRoomSlug(edge, { deterministicKey: 'edge-key' }),
        /^r-[a-z0-9]{6}$/
      );
    }
    assert.equal(RESERVED_ROOM_SLUGS.has('admin'), true);
    assert.equal(RESERVED_ROOM_SLUGS.has('new'), true);
    assert.equal(RESERVED_ROOM_SLUGS.has('signup'), true);
  });

  it('caps normalized base at 48 chars without trailing hyphens and uses random r-<6alnum> when unkeyed', () => {
    const longSlug = buildRoomSlug(`${'a'.repeat(47)}-bbbbbb`, {
      deterministicKey: 'k',
    });
    assert.equal(longSlug.length <= 48, true);
    assert.equal(longSlug, 'a'.repeat(47));

    const postTruncShort = buildRoomSlug(`-x-${' '.repeat(60)}`, {
      deterministicKey: 'k2',
    });
    assert.match(postTruncShort, /^r-[a-z0-9]{6}$/);

    const randomSlug = buildRoomSlug('บริจาคเพลง');
    assert.match(randomSlug, /^r-[a-z0-9]{6}$/);
  });

  it('validates lowercase hyphen-joined slugs and rejects uppercase, whitespace, slashes, double hyphens, and UUIDs', () => {
    assert.equal(isValidRoomSlug('local-postgres'), true);
    assert.equal(isValidRoomSlug('r-a1b2c3'), true);
    assert.equal(isValidRoomSlug('Local-Postgres'), false);
    assert.equal(isValidRoomSlug(''), false);
    assert.equal(isValidRoomSlug('foo--bar'), false);
    assert.equal(isValidRoomSlug('-foo'), false);
    assert.equal(isValidRoomSlug('foo-'), false);
    assert.equal(isValidRoomSlug('foo/bar'), false);
    assert.equal(isValidRoomSlug('foo bar'), false);
    assert.equal(
      isValidRoomSlug('22222222-2222-4222-8222-222222222222'),
      false
    );
    assert.equal(
      isUuidString('00000000-0000-0000-0000-000000000000'),
      true
    );
    assert.equal(
      isValidRoomSlug('00000000-0000-0000-0000-000000000000'),
      false
    );
  });

  it('resolves unique slug with -<4char> suffix on collision and throws after maxAttempts', async () => {
    const taken = new Set(['local-postgres']);
    const deduped = await resolveUniqueRoomSlug(
      'Local Postgres',
      async (candidate) => taken.has(candidate),
      { deterministicKey: '22222222-2222-4222-8222-222222222222' }
    );
    assert.match(deduped, /^local-postgres-[a-z0-9]{4}$/);
    assert.equal(isValidRoomSlug(deduped), true);

    await assert.rejects(
      () =>
        resolveUniqueRoomSlug('ACS Leak', () => true, {
          deterministicKey: 'k',
          maxAttempts: 3,
        }),
      /unique room slug/i
    );
  });
});
