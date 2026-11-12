import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMOJI_CATALOG,
  QUICK_REACTIONS,
  getEmojiItem,
  getEmojiLabel,
} from './emoji-catalog.ts';
import { getMockBoardPosts, getMockPostThread } from './mock/post-thread.ts';

describe('emoji-catalog', () => {
  it('contains culturally accurate Thai labels and valid hex values', () => {
    assert.equal(getEmojiItem('😣')?.hex, '1f623');
    assert.equal(getEmojiLabel('😣'), 'ปวดใจ');
    assert.equal(getEmojiLabel('😭'), 'ร้องไห้หนักมาก');
    assert.equal(getEmojiLabel('🥹'), 'ซาบซึ้ง');
    assert.equal(getEmojiLabel('❤️'), 'หัวใจ');
    assert.equal(getEmojiLabel('👍'), 'ถูกใจ');
  });

  it('quick reactions include primary sad/empathy emojis for room context', () => {
    assert.deepEqual(QUICK_REACTIONS, ['😭', '🥹', '😢', '😣', '😂', '👍']);
    for (const char of QUICK_REACTIONS) {
      assert.ok(EMOJI_CATALOG[char], `Missing catalog entry for quick reaction ${char}`);
    }
  });

  it('guarantees every emoji in mock data exists in EMOJI_CATALOG', () => {
    const boardPosts = getMockBoardPosts('songs');
    const thread1 = getMockPostThread('songs', 'board-1');
    const thread2 = getMockPostThread('songs', 'board-2');
    const thread3 = getMockPostThread('songs', 'board-3');

    const allMockEmojis = new Set<string>();
    boardPosts.forEach((p) => p.reactions.forEach((r) => allMockEmojis.add(r.emoji)));
    [thread1, thread2, thread3].forEach(({ thread }) => {
      thread.reactions.forEach((r) => allMockEmojis.add(r.emoji));
      thread.comments.forEach((c) => {
        c.reactions.forEach((r) => allMockEmojis.add(r.emoji));
        c.replies.forEach((rep) => rep.reactions.forEach((r) => allMockEmojis.add(r.emoji)));
      });
    });

    for (const char of allMockEmojis) {
      assert.ok(
        EMOJI_CATALOG[char],
        `Mock emoji ${char} is missing from EMOJI_CATALOG`
      );
    }
  });
});
