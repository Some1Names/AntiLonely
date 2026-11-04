import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toggleReaction,
  togglePostReaction,
  toggleCommentReaction,
  addTopLevelComment,
  addNestedReply,
  editCommentOrReply,
  deleteCommentOrReply,
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
    const postReaction = updatedPost.reactions.find((r) => r.emoji === '😣');
    assert.equal(postReaction?.count, 9);
    assert.equal(postReaction?.reactedByMe, true);

    const revertedPost = togglePostReaction(updatedPost, '😣');
    const revertedPostReaction = revertedPost.reactions.find((r) => r.emoji === '😣');
    assert.equal(revertedPostReaction?.count, 8);
    assert.equal(revertedPostReaction?.reactedByMe, false);

    const updatedTop = toggleCommentReaction(thread.comments, 'comment-1', '😢');
    const topReaction = updatedTop[0].reactions.find((r) => r.emoji === '😢');
    assert.equal(topReaction?.count, 6);
    assert.equal(topReaction?.reactedByMe, true);

    const updatedNested = toggleCommentReaction(thread.comments, 'reply-1', '😂');
    const nestedReaction = updatedNested[0].replies[0].reactions.find(
      (r) => r.emoji === '😂'
    );
    assert.equal(nestedReaction?.count, 5);
    assert.equal(nestedReaction?.reactedByMe, true);
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

  it('records replyTo on nested replies when replying to a specific author', () => {
    const { thread, currentUser } = getMockPostThread('music', 'post-1', refNow);
    const updated = addNestedReply(
      thread.comments,
      'comment-1',
      'จริงด้วยครับ',
      currentUser,
      '2026-10-24T12:03:00.000Z',
      thread.author.id,
      { id: 'anon-512', name: 'สายฝน' }
    );
    const lastReply = updated[0].replies.at(-1);
    assert.deepEqual(lastReply?.replyTo, { id: 'anon-512', name: 'สายฝน' });
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

  it('edits own top-level comment or nested reply and marks isEdited, ignoring unauthorized or blank edits', () => {
    const { thread, currentUser } = getMockPostThread('songs', 'post-1', refNow);
    const withMyComment = addTopLevelComment(
      thread.comments,
      'ข้อความเดิม',
      currentUser,
      '2026-10-24T12:01:00.000Z'
    );
    const myCommentId = withMyComment.at(-1)!.id;

    // Unauthorized edit on comment-1 (owned by anon-203) is ignored
    const unauthorized = editCommentOrReply(
      withMyComment,
      'comment-1',
      'แอบแก้ของคนอื่น',
      currentUser.id
    );
    assert.equal(unauthorized[0].content, 'เพลงพี่อิงค์เศร้าทุกเพลงจิง');
    assert.equal(unauthorized[0].isEdited, undefined);

    // Unauthorized edit on nested reply-1 (owned by user-op) is ignored
    const unauthorizedReply = editCommentOrReply(
      withMyComment,
      'reply-1',
      'แอบแก้คอมเมนต์ย่อยคนอื่น',
      currentUser.id
    );
    assert.equal(unauthorizedReply[0].replies[0].content, '56565658845156');
    assert.equal(unauthorizedReply[0].replies[0].isEdited, undefined);

    // Blank user ID is rejected even if author.id is also blank
    const anonComments = addTopLevelComment(
      withMyComment,
      'นิรนาม',
      { id: '   ', name: 'นิรนาม' },
      '2026-10-24T12:02:00.000Z'
    );
    const anonId = anonComments.at(-1)!.id;
    const blankUserEdit = editCommentOrReply(anonComments, anonId, 'แก้โดยไม่มี user id', '   ');
    assert.equal(blankUserEdit.at(-1)?.content, 'นิรนาม');

    // Blank edit is ignored
    const blankEdit = editCommentOrReply(withMyComment, myCommentId, '   ', currentUser.id);
    assert.equal(blankEdit.at(-1)?.content, 'ข้อความเดิม');
    assert.equal(blankEdit.at(-1)?.isEdited, undefined);

    // Same-content edit does not set isEdited
    const sameEdit = editCommentOrReply(withMyComment, myCommentId, '  ข้อความเดิม  ', currentUser.id);
    assert.equal(sameEdit.at(-1)?.isEdited, undefined);

    // Valid edit on own top-level comment
    const editedTop = editCommentOrReply(
      withMyComment,
      myCommentId,
      '  ข้อความที่แก้ไขแล้ว  ',
      currentUser.id
    );
    assert.equal(editedTop.at(-1)?.content, 'ข้อความที่แก้ไขแล้ว');
    assert.equal(editedTop.at(-1)?.isEdited, true);

    // Valid edit on own nested reply (reply-3 owned by user-platoo)
    const editedNested = editCommentOrReply(
      editedTop,
      'reply-3',
      'แก้ไขคอมเมนต์ย่อย',
      currentUser.id
    );
    assert.equal(editedNested[0].replies[2].content, 'แก้ไขคอมเมนต์ย่อย');
    assert.equal(editedNested[0].replies[2].isEdited, true);
  });

  it('deletes own top-level comment or nested reply and blocks deleting others comments', () => {
    const { thread, currentUser } = getMockPostThread('songs', 'post-1', refNow);

    // Cannot delete comment-1 (owned by anon-203)
    const blocked = deleteCommentOrReply(thread.comments, 'comment-1', currentUser.id);
    assert.equal(blocked.length, 2);

    // Cannot delete nested reply-1 (owned by user-op)
    const blockedReply = deleteCommentOrReply(thread.comments, 'reply-1', currentUser.id);
    assert.equal(blockedReply[0].replies.length, 3);

    // Blank user ID cannot delete even if author.id is blank
    const anonComments = addTopLevelComment(
      thread.comments,
      'นิรนาม',
      { id: '   ', name: 'นิรนาม' },
      '2026-10-24T12:02:00.000Z'
    );
    const anonId = anonComments.at(-1)!.id;
    const blockedBlankUser = deleteCommentOrReply(anonComments, anonId, '   ');
    assert.equal(blockedBlankUser.length, anonComments.length);

    // Can delete own nested reply (reply-3 owned by user-platoo)
    const afterNestedDelete = deleteCommentOrReply(
      thread.comments,
      'reply-3',
      currentUser.id
    );
    assert.equal(afterNestedDelete[0].replies.length, 2);
    assert.equal(
      afterNestedDelete[0].replies.some((r) => r.id === 'reply-3'),
      false
    );

    // Can delete own top-level comment
    const afterTopDelete = deleteCommentOrReply(
      afterNestedDelete,
      'comment-1',
      'anon-203'
    );
    assert.equal(afterTopDelete.length, 1);
    assert.equal(afterTopDelete[0].id, 'comment-2');
  });
});
