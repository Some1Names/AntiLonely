import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { groupRepliesIntoBranches } from './post-thread.ts';
import {
  buildPostThreadFromMessages,
  canMemberCommentInRoom,
  collectClientSubtreeIds,
  collectSubtreeMessageIds,
  deleteCommentSubtreeOptimistic,
  isMessageInPostSubtree,
  MAX_COMMENT_CONTENT_LENGTH,
  removeDeletedIdsFromComments,
  validateCommentContent,
  type DbThreadMessageRow,
} from './post-thread-mapper.ts';

const ROOM_ID = '11111111-1111-4111-8111-111111111111';
const POST_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_POST_ID = '99999999-9999-4999-8999-999999999999';

function makeMsg(
  overrides: Partial<DbThreadMessageRow> & Pick<DbThreadMessageRow, 'id' | 'content'>
): DbThreadMessageRow {
  return {
    roomId: ROOM_ID,
    parentId: null,
    status: 'visible',
    createdAt: new Date('2026-11-14T10:00:00.000Z'),
    authorId: 'user-1',
    author: {
      id: 'user-1',
      username: 'user1',
      displayUsername: 'ผู้โพสต์หลัก',
      name: 'User One',
    },
    reactions: [],
    ...overrides,
  };
}

describe('post-thread-mapper domain helpers', () => {
  it('validates comment content trimming, empty checks, and max length', () => {
    assert.deepEqual(validateCommentContent('  สวัสดีครับ  '), {
      ok: true,
      value: 'สวัสดีครับ',
    });
    assert.deepEqual(validateCommentContent('   \n\t  '), {
      ok: false,
      error: 'กรุณาพิมพ์ข้อความก่อนส่งความคิดเห็น',
    });
    const tooLong = 'ก'.repeat(MAX_COMMENT_CONTENT_LENGTH + 1);
    assert.deepEqual(validateCommentContent(tooLong), {
      ok: false,
      error: `เนื้อหาความคิดเห็นยาวเกินไป (สูงสุด ${MAX_COMMENT_CONTENT_LENGTH} ตัวอักษร)`,
    });
  });

  it('enforces membership and lock gating for commenting in a room', () => {
    assert.deepEqual(
      canMemberCommentInRoom({ isLocked: false, memberStatus: 'active' }),
      { ok: true }
    );
    assert.deepEqual(
      canMemberCommentInRoom({ isLocked: true, memberStatus: 'active' }),
      {
        ok: false,
        error: 'ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถแสดงความคิดเห็นได้',
      }
    );
    assert.deepEqual(
      canMemberCommentInRoom({ isLocked: false, memberStatus: null }),
      { ok: false, error: 'กรุณาเข้าร่วมห้องก่อนแสดงความคิดเห็น' }
    );
    assert.deepEqual(
      canMemberCommentInRoom({ isLocked: false, memberStatus: undefined }),
      { ok: false, error: 'กรุณาเข้าร่วมห้องก่อนแสดงความคิดเห็น' }
    );
    assert.deepEqual(
      canMemberCommentInRoom({ isLocked: false, memberStatus: 'left' }),
      { ok: false, error: 'กรุณาเข้าร่วมห้องก่อนแสดงความคิดเห็น' }
    );
    assert.deepEqual(
      canMemberCommentInRoom({ isLocked: false, memberStatus: 'muted' }),
      {
        ok: false,
        error: 'คุณถูกจำกัดสิทธิ์การแสดงความคิดเห็นในห้องนี้ชั่วคราว',
      }
    );
    assert.deepEqual(
      canMemberCommentInRoom({ isLocked: false, memberStatus: 'banned' }),
      { ok: false, error: 'คุณถูกระงับสิทธิ์การใช้งานในห้องนี้' }
    );
  });

  it('reconstructs multi-level comments and nested replies from Message.parentId', () => {
    const post = makeMsg({
      id: POST_ID,
      authorId: 'u-post',
      author: {
        id: 'u-post',
        username: 'postowner',
        displayUsername: 'เจ้าของห้องลอง',
        name: 'Post Owner',
      },
      content: 'กระทู้ต้นเรื่อง',
      createdAt: new Date('2026-11-14T08:00:00.000Z'),
      reactions: [
        { emojiType: '❤️', userId: 'u-2' },
        { emojiType: '❤️', userId: 'u-3' },
      ],
    });

    const c1 = makeMsg({
      id: 'c-1',
      parentId: POST_ID,
      authorId: 'u-2',
      author: {
        id: 'u-2',
        username: 'cat',
        displayUsername: 'แมวดำ',
        name: 'Cat',
      },
      content: 'คอมเมนต์ 1',
      createdAt: new Date('2026-11-14T08:05:00.000Z'),
    });

    const c2 = makeMsg({
      id: 'c-2',
      parentId: POST_ID,
      authorId: 'u-post',
      author: {
        id: 'u-post',
        username: 'postowner',
        displayUsername: 'เจ้าของห้องลอง',
        name: 'Post Owner',
      },
      content: 'คอมเมนต์ 2 จากเจ้าของกระทู้',
      createdAt: new Date('2026-11-14T08:02:00.000Z'),
    });

    // Direct reply from different author -> replyTo.isNested = false
    const r1 = makeMsg({
      id: 'r-1',
      parentId: 'c-1',
      authorId: 'u-post',
      author: {
        id: 'u-post',
        username: 'postowner',
        displayUsername: 'เจ้าของห้องลอง',
        name: 'Post Owner',
      },
      content: 'ตอบกลับคอมเมนต์ 1 (คนละคน)',
      createdAt: new Date('2026-11-14T08:06:00.000Z'),
    });

    // Direct reply from same author as comment -> replyTo = undefined
    const r2 = makeMsg({
      id: 'r-2',
      parentId: 'c-1',
      authorId: 'u-2',
      author: {
        id: 'u-2',
        username: 'cat',
        displayUsername: 'แมวดำ',
        name: 'Cat',
      },
      content: 'พูดต่อเองใต้คอมเมนต์ 1',
      createdAt: new Date('2026-11-14T08:09:00.000Z'),
    });

    // Depth-3 reply targeting r-1 -> replyTo.isNested = true pointing to r-1
    const r1Child = makeMsg({
      id: 'r-1-1',
      parentId: 'r-1',
      authorId: 'u-3',
      author: {
        id: 'u-3',
        username: 'bird',
        displayUsername: 'นกฮูก',
        name: 'Bird',
      },
      content: 'ตอบกลับย่อยชั้น 3 ถึงเจ้าของกระทู้',
      createdAt: new Date('2026-11-14T08:07:00.000Z'),
    });

    // Depth-4 reply targeting r-1-1 -> replyTo.isNested = true pointing to r-1-1
    const r1GrandChild = makeMsg({
      id: 'r-1-1-1',
      parentId: 'r-1-1',
      authorId: 'u-post',
      author: {
        id: 'u-post',
        username: 'postowner',
        displayUsername: 'เจ้าของห้องลอง',
        name: 'Post Owner',
      },
      content: 'ตอบกลับย่อยชั้น 4 ถึงนกฮูก',
      createdAt: new Date('2026-11-14T08:08:00.000Z'),
    });

    // Unrelated message under another post in the same room must not appear
    const otherPostComment = makeMsg({
      id: 'other-c-1',
      parentId: OTHER_POST_ID,
      content: 'ของอีกกระทู้',
      createdAt: new Date('2026-11-14T08:01:00.000Z'),
    });

    const thread = buildPostThreadFromMessages({
      room: { slug: 'local-postgres', name: 'ห้องทดลอง Local Postgres' },
      post,
      messages: [r2, r1GrandChild, c1, c2, r1Child, r1, otherPostComment],
      currentUserId: 'u-2',
    });

    assert.equal(thread.id, POST_ID);
    assert.equal(thread.boardSlug, 'local-postgres');
    assert.equal(thread.boardName, 'ห้องทดลอง Local Postgres');
    assert.deepEqual(thread.author, { id: 'u-post', name: 'เจ้าของห้องลอง' });
    assert.deepEqual(thread.reactions, [
      { emoji: '❤️', count: 2, reactedByMe: true },
    ]);

    // Chronological order: c2 (08:02) before c1 (08:05)
    assert.equal(thread.comments.length, 2);
    assert.equal(thread.comments[0].id, 'c-2');
    assert.equal(thread.comments[0].isPostAuthor, true);
    assert.deepEqual(thread.comments[0].replies, []);

    const mappedC1 = thread.comments[1];
    assert.equal(mappedC1.id, 'c-1');
    assert.equal(mappedC1.isPostAuthor, false);
    assert.deepEqual(
      mappedC1.replies.map((r) => r.id),
      ['r-1', 'r-1-1', 'r-1-1-1', 'r-2']
    );

    assert.deepEqual(mappedC1.replies[0].replyTo, {
      id: 'c-1',
      name: 'แมวดำ',
      isNested: false,
    });
    assert.equal(mappedC1.replies[0].isPostAuthor, true);

    assert.deepEqual(mappedC1.replies[1].replyTo, {
      id: 'r-1',
      name: 'เจ้าของห้องลอง',
      isNested: true,
    });
    assert.deepEqual(mappedC1.replies[2].replyTo, {
      id: 'r-1-1',
      name: 'นกฮูก',
      isNested: true,
    });
    assert.equal(mappedC1.replies[3].replyTo, undefined);

    // Ensure compatibility with UI branch grouper
    const branches = groupRepliesIntoBranches(
      mappedC1.replies,
      mappedC1.author.name
    );
    assert.equal(branches.length, 2);
    assert.equal(branches[0].parent.id, 'r-1');
    assert.deepEqual(
      branches[0].children.map((c) => c.id),
      ['r-1-1', 'r-1-1-1']
    );
    assert.equal(branches[1].parent.id, 'r-2');
    assert.deepEqual(branches[1].children, []);
  });

  it('excludes hidden/deleted comments or intermediate replies and all their descendants', () => {
    const post = makeMsg({ id: POST_ID, content: 'root' });
    const hiddenComment = makeMsg({
      id: 'c-hidden',
      parentId: POST_ID,
      status: 'hidden',
      content: 'ซ่อน',
    });
    const childUnderHiddenComment = makeMsg({
      id: 'r-under-hidden',
      parentId: 'c-hidden',
      status: 'visible',
      content: 'ลูกของคอมเมนต์ที่ถูกซ่อน',
    });

    const visibleComment = makeMsg({
      id: 'c-visible',
      parentId: POST_ID,
      status: 'visible',
      content: 'เห็นได้',
    });
    const deletedIntermediateReply = makeMsg({
      id: 'r-deleted',
      parentId: 'c-visible',
      status: 'deleted',
      content: 'ถูกลบ',
    });
    const orphanedChildReply = makeMsg({
      id: 'r-orphan',
      parentId: 'r-deleted',
      status: 'visible',
      content: 'ลูกของรีพลายที่ถูกลบ',
    });
    const survivingReply = makeMsg({
      id: 'r-survive',
      parentId: 'c-visible',
      status: 'visible',
      content: 'ยังอยู่',
    });

    const thread = buildPostThreadFromMessages({
      room: { slug: 'acs-leak', name: 'ACS Leak' },
      post,
      messages: [
        hiddenComment,
        childUnderHiddenComment,
        visibleComment,
        deletedIntermediateReply,
        orphanedChildReply,
        survivingReply,
      ],
    });

    assert.deepEqual(
      thread.comments.map((c) => c.id),
      ['c-visible']
    );
    assert.deepEqual(
      thread.comments[0].replies.map((r) => r.id),
      ['r-survive']
    );
  });

  it('validates whether target message belongs to the visible post subtree', () => {
    const messages = [
      { id: POST_ID, parentId: null, status: 'visible' as const },
      { id: 'c-1', parentId: POST_ID, status: 'visible' as const },
      { id: 'r-1', parentId: 'c-1', status: 'visible' as const },
      { id: 'c-deleted', parentId: POST_ID, status: 'deleted' as const },
      { id: 'r-under-deleted', parentId: 'c-deleted', status: 'visible' as const },
      { id: OTHER_POST_ID, parentId: null, status: 'visible' as const },
      { id: 'other-c', parentId: OTHER_POST_ID, status: 'visible' as const },
    ];

    assert.equal(isMessageInPostSubtree(POST_ID, POST_ID, messages), true);
    assert.equal(isMessageInPostSubtree(POST_ID, 'c-1', messages), true);
    assert.equal(isMessageInPostSubtree(POST_ID, 'r-1', messages), true);

    assert.equal(isMessageInPostSubtree(POST_ID, 'missing', messages), false);
    assert.equal(isMessageInPostSubtree(POST_ID, 'c-deleted', messages), false);
    assert.equal(isMessageInPostSubtree(POST_ID, 'r-under-deleted', messages), false);
    assert.equal(isMessageInPostSubtree(POST_ID, OTHER_POST_ID, messages), false);
    assert.equal(isMessageInPostSubtree(POST_ID, 'other-c', messages), false);
  });

  it('collects target message id and all nested descendant ids for cascade soft delete', () => {
    const messages = [
      { id: 'c-1', parentId: POST_ID },
      { id: 'r-1', parentId: 'c-1' },
      { id: 'r-2', parentId: 'c-1' },
      { id: 'r-1-1', parentId: 'r-1' },
      { id: 'r-1-1-1', parentId: 'r-1-1' },
      { id: 'c-2', parentId: POST_ID },
      { id: 'c-2-r-1', parentId: 'c-2' },
    ];

    assert.deepEqual(collectSubtreeMessageIds('c-1', messages), [
      'c-1',
      'r-1',
      'r-2',
      'r-1-1',
      'r-1-1-1',
    ]);
    assert.deepEqual(collectSubtreeMessageIds('r-1', messages), [
      'r-1',
      'r-1-1',
      'r-1-1-1',
    ]);
    assert.deepEqual(collectSubtreeMessageIds('r-1-1-1', messages), ['r-1-1-1']);
  });

  it('collects and optimistically removes nested reply subtrees in client ThreadComment state', () => {
    const post = makeMsg({ id: POST_ID, content: 'root' });
    const c1 = makeMsg({ id: 'c-1', parentId: POST_ID, authorId: 'u-1', content: 'c1' });
    const r1 = makeMsg({ id: 'r-1', parentId: 'c-1', authorId: 'u-2', content: 'r1' });
    const r1Child = makeMsg({ id: 'r-1-1', parentId: 'r-1', authorId: 'u-3', content: 'r1-1' });
    const r1Grandchild = makeMsg({
      id: 'r-1-1-1',
      parentId: 'r-1-1',
      authorId: 'u-2',
      content: 'r1-1-1',
    });
    const rSibling = makeMsg({
      id: 'r-2',
      parentId: 'c-1',
      authorId: 'u-3',
      content: 'r2',
    });

    const thread = buildPostThreadFromMessages({
      room: { slug: 'local-postgres', name: 'Test' },
      post,
      messages: [c1, r1, r1Child, r1Grandchild, rSibling],
    });

    // Subtree collection on intermediate reply includes its descendants, not siblings
    assert.deepEqual(collectClientSubtreeIds(thread.comments, 'r-1'), [
      'r-1',
      'r-1-1',
      'r-1-1-1',
    ]);
    assert.deepEqual(collectClientSubtreeIds(thread.comments, 'c-1'), [
      'c-1',
      'r-1',
      'r-1-1',
      'r-1-1-1',
      'r-2',
    ]);

    // Non-owner cannot optimistically delete another user's reply
    const unauthorized = deleteCommentSubtreeOptimistic(thread.comments, 'r-1', 'u-3');
    assert.deepEqual(unauthorized.removedIds, []);
    assert.equal(unauthorized.nextComments[0].replies.length, 4);

    // Owner deleting intermediate reply r-1 removes r-1, r-1-1, r-1-1-1 immediately, keeping r-2
    const optimistic = deleteCommentSubtreeOptimistic(thread.comments, 'r-1', 'u-2');
    assert.deepEqual(optimistic.removedIds, ['r-1', 'r-1-1', 'r-1-1-1']);
    assert.deepEqual(
      optimistic.nextComments[0].replies.map((r) => r.id),
      ['r-2']
    );

    // Reapplying server deletedIds via removeDeletedIdsFromComments stays consistent
    const afterServer = removeDeletedIdsFromComments(
      thread.comments,
      optimistic.removedIds
    );
    assert.deepEqual(
      afterServer[0].replies.map((r) => r.id),
      ['r-2']
    );
  });
});
