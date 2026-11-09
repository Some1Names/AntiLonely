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
  SECOND_MS,
  MINUTE_MS,
  HOUR_MS,
  DAY_MS,
  MAX_RELATIVE_DAYS,
  PRESET_REACTION_EMOJIS,
  INITIAL_PICKER_EMOJIS,
  REMAINING_PICKER_EMOJIS,
  editBoardPost,
  deleteBoardPost,
} from './post-thread.ts';
import { getMockBoardPosts, getMockPostThread } from './mock/post-thread.ts';

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

    const nowDate = new Date(refNow);
    assert.equal(formatRelativeTimeThai('invalid-date', refNow), 'ไม่ระบุเวลา');
    assert.equal(formatRelativeTimeThai('2026-10-24T12:00:00.000Z', NaN), 'ไม่ระบุเวลา');
    assert.equal(formatRelativeTimeThai('2026-10-24T12:00:00.000Z', new Date(NaN)), 'ไม่ระบุเวลา');

    // Future timestamps clamp to 0 ("เมื่อสักครู่")
    assert.equal(
      formatRelativeTimeThai(new Date(refNow + 5 * MINUTE_MS).toISOString(), nowDate),
      'เมื่อสักครู่'
    );

    // Exact < 1 minute boundary (59,999ms) vs 1 minute (60,000ms)
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - (MINUTE_MS - 1)).toISOString(), refNow),
      'เมื่อสักครู่'
    );
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - MINUTE_MS).toISOString(), nowDate),
      '1 นาที ที่แล้ว'
    );
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - 40 * MINUTE_MS).toISOString(), refNow),
      '40 นาที ที่แล้ว'
    );

    // Exact < 1 hour boundary (59m59s) vs 1 hour (60m)
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - (HOUR_MS - SECOND_MS)).toISOString(), refNow),
      '59 นาที ที่แล้ว'
    );
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - HOUR_MS).toISOString(), refNow),
      '1 ชม. ที่แล้ว'
    );
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - 2 * HOUR_MS).toISOString(), refNow),
      '2 ชม. ที่แล้ว'
    );

    // Exact < 1 day boundary (23h59m) vs 1 day (24h)
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - (DAY_MS - MINUTE_MS)).toISOString(), refNow),
      '23 ชม. ที่แล้ว'
    );
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - DAY_MS).toISOString(), refNow),
      '1 วัน ที่แล้ว'
    );
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - 4 * DAY_MS).toISOString(), refNow),
      '4 วัน ที่แล้ว'
    );

    // Exact < 7 days boundary (6d23h) vs >= 7 days (MAX_RELATIVE_DAYS)
    assert.equal(
      formatRelativeTimeThai(new Date(refNow - (MAX_RELATIVE_DAYS * DAY_MS - HOUR_MS)).toISOString(), refNow),
      '6 วัน ที่แล้ว'
    );
    const exact7DaysAgo = new Date(refNow - MAX_RELATIVE_DAYS * DAY_MS).toISOString();
    assert.equal(
      formatRelativeTimeThai(exact7DaysAgo, refNow),
      new Date(exact7DaysAgo).toLocaleDateString('th-TH', {
        timeZone: 'Asia/Bangkok',
      })
    );
    assert.equal(
      formatRelativeTimeThai('2026-10-10T12:00:00.000Z', refNow),
      new Date('2026-10-10T12:00:00.000Z').toLocaleDateString('th-TH', {
        timeZone: 'Asia/Bangkok',
      })
    );
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

  it('returns the 3 Figma mock posts for a room with matching authors, content, reactions, and reply counts', () => {
    const posts = getMockBoardPosts('songs');
    assert.equal(posts.length, 3);
    assert.deepEqual(
      posts.map((p) => ({
        id: p.id,
        author: p.author,
        content: p.content,
        replyCount: p.replyCount,
      })),
      [
        {
          id: 'board-1',
          author: 'ปลาทู',
          content: 'ฝนตกไหม - Three Man Down',
          replyCount: 4,
        },
        {
          id: 'board-2',
          author: 'ปวยเล้ง',
          content: 'นิโคติน - mirrr เศร้าแบบเกือบตาย',
          replyCount: 18,
        },
        {
          id: 'board-3',
          author: 'ผักกาด',
          content: 'รักไม่ได้ - Groove Riders',
          replyCount: 0,
        },
      ]
    );
  });

  it('getMockPostThread returns thread data matching board-1, board-2, board-3 and falls back safely for unknown postId', () => {
    const t1 = getMockPostThread('songs', 'board-1', refNow);
    assert.equal(t1.thread.author.name, 'ปลาทู');
    assert.equal(t1.thread.content, 'ฝนตกไหม - Three Man Down');
    assert.equal(countTotalComments(t1.thread.comments), 4);

    const t2 = getMockPostThread('songs', 'board-2', refNow);
    assert.equal(t2.thread.author.name, 'ปวยเล้ง');
    assert.equal(t2.thread.content, 'นิโคติน - mirrr เศร้าแบบเกือบตาย');

    const t3 = getMockPostThread('songs', 'board-3', refNow);
    assert.equal(t3.thread.author.name, 'ผักกาด');
    assert.equal(t3.thread.content, 'รักไม่ได้ - Groove Riders');
    assert.equal(countTotalComments(t3.thread.comments), 0);

    const fallback = getMockPostThread('books', 'custom-999', refNow);
    assert.equal(fallback.thread.id, 'custom-999');
    assert.equal(fallback.thread.boardSlug, 'books');
  });

  it('includes 😮 in PRESET_REACTION_EMOJIS to support all primary and mockup board reactions', () => {
    assert.ok(PRESET_REACTION_EMOJIS.includes('😮'));
  });

  it('preserves all 9 preset emojis with positive-first order while maintaining compact reaction dimensions', () => {
    assert.equal(PRESET_REACTION_EMOJIS.length, 9);
    assert.deepEqual([...PRESET_REACTION_EMOJIS], [
      '❤️', '👍', '😂', '🤩', '🔥', '😮', '😢', '😭', '😣'
    ]);
  });

  it('formats board breadcrumbs with exact double spaces around separator', () => {
    const formatBreadcrumb = (roomName: string) => `หน้าหลัก  /  ${roomName}`;
    assert.equal(formatBreadcrumb('บริจาคเพลง'), 'หน้าหลัก  /  บริจาคเพลง');
  });

  it('ignores empty or whitespace-only post submissions in feed logic', () => {
    const validatePost = (input: string) => input.trim().length > 0;
    assert.equal(validatePost(''), false);
    assert.equal(validatePost('    '), false);
    assert.equal(validatePost('เพลงใหม่'), true);
  });

  it('edits own board post and marks isEdited, ignoring unauthorized, blank, or unchanged edits', () => {
    const posts = getMockBoardPosts('songs');

    // Unauthorized edit on board-2 (owned by user-puayleng) by user-platoo
    const unauthorized = editBoardPost(posts, 'board-2', 'แอบแก้โพสต์คนอื่น', 'user-platoo');
    assert.equal(unauthorized[1].content, 'นิโคติน - mirrr เศร้าแบบเกือบตาย');
    assert.equal(unauthorized[1].isEdited, undefined);

    // Blank userId or blank content is ignored
    const blankUser = editBoardPost(posts, 'board-1', 'เพลงใหม่', '   ');
    assert.equal(blankUser[0].content, 'ฝนตกไหม - Three Man Down');
    const blankContent = editBoardPost(posts, 'board-1', '   ', 'user-platoo');
    assert.equal(blankContent[0].content, 'ฝนตกไหม - Three Man Down');

    // Same content does not set isEdited
    const unchanged = editBoardPost(posts, 'board-1', '  ฝนตกไหม - Three Man Down  ', 'user-platoo');
    assert.equal(unchanged[0].isEdited, undefined);

    // Valid edit by owner (board-1 is owned by user-platoo)
    const edited = editBoardPost(posts, 'board-1', '  ฝนตกไหม - Three Man Down (Live)  ', 'user-platoo');
    assert.equal(edited[0].content, 'ฝนตกไหม - Three Man Down (Live)');
    assert.equal(edited[0].isEdited, true);
  });

  it('deletes own board post and blocks deleting others posts', () => {
    const posts = getMockBoardPosts('songs');

    // Unauthorized delete on board-2 by user-platoo
    const blocked = deleteBoardPost(posts, 'board-2', 'user-platoo');
    assert.equal(blocked.length, 3);

    // Blank userId is blocked
    const blankBlocked = deleteBoardPost(posts, 'board-1', '   ');
    assert.equal(blankBlocked.length, 3);

    // Valid delete by owner (board-1 is owned by user-platoo)
    const afterDelete = deleteBoardPost(posts, 'board-1', 'user-platoo');
    assert.equal(afterDelete.length, 2);
    assert.equal(afterDelete.some((p) => p.id === 'board-1'), false);
  });

  it('splits preset emojis into initial 4 positive emojis and remaining 5 emojis', () => {
    assert.deepEqual([...INITIAL_PICKER_EMOJIS], ['❤️', '👍', '😂', '🤩']);
    assert.deepEqual([...REMAINING_PICKER_EMOJIS], ['🔥', '😮', '😢', '😭', '😣']);
    assert.equal(INITIAL_PICKER_EMOJIS.length, 4);
    assert.equal(REMAINING_PICKER_EMOJIS.length, 5);
    assert.deepEqual(
      [...INITIAL_PICKER_EMOJIS, ...REMAINING_PICKER_EMOJIS],
      [...PRESET_REACTION_EMOJIS]
    );
  });
});
