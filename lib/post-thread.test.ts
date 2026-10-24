import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toggleReaction,
  togglePostReaction,
  toggleCommentReaction,
  addTopLevelComment,
  addNestedReply,
  sortComments,
  countTotalComments,
  formatRelativeTimeThai,
} from './post-thread.ts';
import { getMockPostThread } from './mock/post-thread.ts';

describe('post-thread domain logic', () => {
  const refNow = Date.parse('2026-10-24T12:00:00.000Z');

  it('toggles an existing un-reacted emoji (+1) and reacted emoji (-1)', () => {
    const initial = [
      { emoji: '😣', count: 8, reactedByMe: false },
      { emoji: '😭', count: 17, reactedByMe: true },
    ];
    const afterAdd = toggleReaction(initial, '😣');
    assert.deepEqual(afterAdd[0], { emoji: '😣', count: 9, reactedByMe: true });

    const afterRemove = toggleReaction(afterAdd, '😭');
    assert.deepEqual(afterRemove[1], { emoji: '😭', count: 16, reactedByMe: false });
  });

  it('removes a reaction pill when its count drops to 0 and appends a new emoji with count 1', () => {
    const initial = [{ emoji: '🔥', count: 1, reactedByMe: true }];
    const emptied = toggleReaction(initial, '🔥');
    assert.equal(emptied.length, 0);

    const added = toggleReaction(emptied, '❤️');
    assert.deepEqual(added, [{ emoji: '❤️', count: 1, reactedByMe: true }]);
    assert.deepEqual(toggleReaction(added, '   '), added);
  });

  it('toggles reactions on the main post, top-level comments, and nested replies', () => {
    const { thread } = getMockPostThread('music', 'post-1', refNow);
    const updatedPost = togglePostReaction(thread, '😣');
    assert.equal(updatedPost.reactions.find((r) => r.emoji === '😣')?.count, 9);

    const updatedTop = toggleCommentReaction(thread.comments, 'comment-1', '😢');
    assert.equal(updatedTop[0].reactions.find((r) => r.emoji === '😢')?.count, 6);

    const updatedNested = toggleCommentReaction(thread.comments, 'reply-1', '😂');
    assert.equal(
      updatedNested[0].replies[0].reactions.find((r) => r.emoji === '😂')?.count,
      5
    );
  });

  it('adds top-level comments and ignores whitespace-only input', () => {
    const { thread, currentUser } = getMockPostThread('music', 'post-1', refNow);
    const unchanged = addTopLevelComment(thread.comments, '   ', currentUser);
    assert.equal(unchanged.length, thread.comments.length);

    const updated = addTopLevelComment(
      thread.comments,
      '  เพลงนี้ฟังตอนฝนตกคือที่สุด  ',
      currentUser,
      '2026-10-24T12:01:00.000Z',
      thread.author.id
    );
    assert.equal(updated.length, thread.comments.length + 1);
    assert.equal(updated.at(-1)?.content, 'เพลงนี้ฟังตอนฝนตกคือที่สุด');
    assert.equal(updated.at(-1)?.author.name, 'ปลาทู');
    assert.equal(updated.at(-1)?.isPostAuthor, false);
  });

  it('attaches nested replies to parent comment even when targeting a nested reply ID and marks post author', () => {
    const { thread } = getMockPostThread('music', 'post-1', refNow);
    const beforeCount = thread.comments[0].replies.length;

    const updated = addNestedReply(
      thread.comments,
      'reply-1',
      'ขอบคุณทุกคนที่มาแชร์เพลงกันนะ',
      thread.author,
      '2026-10-24T12:02:00.000Z',
      thread.author.id
    );
    assert.equal(updated[0].replies.length, beforeCount + 1);
    assert.equal(updated[0].replies.at(-1)?.isPostAuthor, true);
  });

  it('sorts top-level comments by oldest and newest while keeping nested replies chronological', () => {
    const { thread } = getMockPostThread('music', 'post-1', refNow);
    const newestFirst = sortComments(thread.comments, 'newest');
    assert.equal(newestFirst[0].id, 'comment-2');
    assert.equal(newestFirst[1].id, 'comment-1');

    const oldestFirst = sortComments(newestFirst, 'oldest');
    assert.equal(oldestFirst[0].id, 'comment-1');
    assert.equal(oldestFirst[1].id, 'comment-2');
  });

  it('counts total comments including nested replies and formats relative Thai time safely', () => {
    const { thread } = getMockPostThread('music', 'post-1', refNow);
    assert.equal(countTotalComments(thread.comments), 5);

    assert.equal(formatRelativeTimeThai('invalid-date', refNow), 'ไม่ระบุเวลา');
    assert.equal(formatRelativeTimeThai('2026-10-24T12:05:00.000Z', refNow), 'เมื่อสักครู่');
    assert.equal(formatRelativeTimeThai('2026-10-24T11:20:00.000Z', refNow), '40 นาที ที่แล้ว');
    assert.equal(formatRelativeTimeThai('2026-10-24T10:00:00.000Z', refNow), '2 ชม. ที่แล้ว');
  });
});
