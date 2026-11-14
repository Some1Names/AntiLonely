import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyReactionActiveState,
  createReactionMutationTracker,
  mergeIncomingReactions,
  mergeThreadReactions,
  reconcileReactions,
  restoreReactionSnapshot,
} from './post-thread.ts';
import {
  requestToggleReaction,
  syncReactionMutation,
  type ToggleReactionRequestFn,
} from './reaction-client.ts';
import {
  applyReactionWithStore,
  executeToggleMessageReaction,
  handleToggleReactionHttp,
  isJsonMutationContentType,
  isSameOriginMutationRequest,
  isSupportedReactionEmoji,
  resolveThreadAncestryStatus,
  toggleReactionWithStore,
  type AncestryNode,
} from './reaction-helpers.ts';
import type { PostThread, ReactionItem } from '../types/post-thread.ts';

describe('reconcileReactions & concurrency tracker', () => {
  it('keeps other in-flight optimistic emojis visible when an earlier toggle settles first', () => {
    const tracker = createReactionMutationTracker();
    let ui: ReactionItem[] = [];

    const e1 = tracker.enqueue('post-1', '❤️', ui)!;
    ui = applyReactionActiveState(ui, '❤️', e1.desiredActive);

    const e2 = tracker.enqueue('post-1', '👍', ui)!;
    ui = applyReactionActiveState(ui, '👍', e2.desiredActive);

    const e3 = tracker.enqueue('post-1', '😂', ui)!;
    ui = applyReactionActiveState(ui, '😂', e3.desiredActive);

    const s1 = tracker.settle('post-1', '❤️', e1.dispatch!.seq)!;
    assert.equal(s1.nextRequest, null);
    ui = reconcileReactions({
      current: ui,
      serverReactions: [{ emoji: '❤️', count: 1, reactedByMe: true }],
      toggledEmoji: '❤️',
      pendingEmojis: s1.pendingEmojis,
      applyExternalUpdates: s1.applyExternalUpdates,
    });

    assert.deepEqual(ui, [
      { emoji: '❤️', count: 1, reactedByMe: true },
      { emoji: '👍', count: 1, reactedByMe: true },
      { emoji: '😂', count: 1, reactedByMe: true },
    ]);
  });

  it('prevents stale out-of-order server responses from dropping newer emojis and preserves order', () => {
    const tracker = createReactionMutationTracker();
    let ui: ReactionItem[] = [];

    const e1 = tracker.enqueue('post-1', '❤️', ui)!;
    ui = applyReactionActiveState(ui, '❤️', e1.desiredActive);

    const e2 = tracker.enqueue('post-1', '👍', ui)!;
    ui = applyReactionActiveState(ui, '👍', e2.desiredActive);

    // Request #2 resolves FIRST
    const s2 = tracker.settle('post-1', '👍', e2.dispatch!.seq)!;
    ui = reconcileReactions({
      current: ui,
      serverReactions: [{ emoji: '👍', count: 1, reactedByMe: true }],
      toggledEmoji: '👍',
      pendingEmojis: s2.pendingEmojis,
      applyExternalUpdates: s2.applyExternalUpdates,
    });
    assert.deepEqual(ui, [
      { emoji: '❤️', count: 1, reactedByMe: true },
      { emoji: '👍', count: 1, reactedByMe: true },
    ]);

    // Stale Request #1 arrives late with snapshot [❤️] missing 👍 — must NOT wipe out 👍 or reorder
    const s1 = tracker.settle('post-1', '❤️', e1.dispatch!.seq)!;
    ui = reconcileReactions({
      current: ui,
      serverReactions: [{ emoji: '❤️', count: 1, reactedByMe: true }],
      toggledEmoji: '❤️',
      pendingEmojis: s1.pendingEmojis,
      applyExternalUpdates: s1.applyExternalUpdates,
    });
    assert.deepEqual(ui, [
      { emoji: '❤️', count: 1, reactedByMe: true },
      { emoji: '👍', count: 1, reactedByMe: true },
    ]);
  });

  it('allows rapid repeated clicks on the same emoji and coalesces to final desired state without intermediate flicker', () => {
    const tracker = createReactionMutationTracker();
    let ui: ReactionItem[] = [{ emoji: '❤️', count: 2, reactedByMe: false }];

    // Click #1: false -> true (dispatches request 1)
    const click1 = tracker.enqueue('post-1', '❤️', ui)!;
    assert.equal(click1.desiredActive, true);
    assert.equal(click1.dispatch?.active, true);
    ui = applyReactionActiveState(ui, '❤️', click1.desiredActive);
    assert.deepEqual(ui, [{ emoji: '❤️', count: 3, reactedByMe: true }]);

    // Click #2 while request 1 is in flight: true -> false (coalesced, UI updates immediately)
    const click2 = tracker.enqueue('post-1', '❤️', ui)!;
    assert.equal(click2.desiredActive, false);
    assert.equal(click2.dispatch, null);
    ui = applyReactionActiveState(ui, '❤️', click2.desiredActive);
    assert.deepEqual(ui, [{ emoji: '❤️', count: 2, reactedByMe: false }]);

    // Request #1 (active: true) returns: must NOT flip UI back to true, and must enqueue active: false
    const s1 = tracker.settle('post-1', '❤️', click1.dispatch!.seq)!;
    assert.ok(s1.nextRequest);
    assert.equal(s1.nextRequest.active, false);
    assert.equal(s1.pendingEmojis.has('❤️'), true);
    ui = reconcileReactions({
      current: ui,
      serverReactions: [
        { emoji: '❤️', count: 3, reactedByMe: true },
        { emoji: '🔥', count: 1, reactedByMe: false },
      ],
      toggledEmoji: '❤️',
      pendingEmojis: s1.pendingEmojis,
      applyExternalUpdates: s1.applyExternalUpdates,
    });
    assert.deepEqual(ui, [
      { emoji: '❤️', count: 2, reactedByMe: false },
      { emoji: '🔥', count: 1, reactedByMe: false },
    ]);

    // Follow-up Request #2 (active: false) settles cleanly
    const s2 = tracker.settle('post-1', '❤️', s1.nextRequest.seq)!;
    assert.equal(s2.nextRequest, null);
    assert.equal(s2.pendingEmojis.has('❤️'), false);
    ui = reconcileReactions({
      current: ui,
      serverReactions: [
        { emoji: '❤️', count: 2, reactedByMe: false },
        { emoji: '🔥', count: 1, reactedByMe: false },
      ],
      toggledEmoji: '❤️',
      pendingEmojis: s2.pendingEmojis,
      applyExternalUpdates: s2.applyExternalUpdates,
    });
    assert.deepEqual(ui, [
      { emoji: '❤️', count: 2, reactedByMe: false },
      { emoji: '🔥', count: 1, reactedByMe: false },
    ]);
  });

  it('skips redundant follow-up request when odd rapid clicks end back at the in-flight active state', () => {
    const tracker = createReactionMutationTracker();
    let ui: ReactionItem[] = [];

    const c1 = tracker.enqueue('post-1', '👍', ui)!; // true (dispatched)
    ui = applyReactionActiveState(ui, '👍', c1.desiredActive);

    const c2 = tracker.enqueue('post-1', '👍', ui)!; // false (coalesced)
    ui = applyReactionActiveState(ui, '👍', c2.desiredActive);

    const c3 = tracker.enqueue('post-1', '👍', ui)!; // true (coalesced)
    ui = applyReactionActiveState(ui, '👍', c3.desiredActive);
    assert.deepEqual(ui, [{ emoji: '👍', count: 1, reactedByMe: true }]);

    const settled = tracker.settle('post-1', '👍', c1.dispatch!.seq)!;
    assert.equal(settled.nextRequest, null);
    assert.equal(settled.pendingEmojis.has('👍'), false);
  });

  it('rolls back rapid clicks to last server-confirmed state without parity inversion on failure', () => {
    const tracker = createReactionMutationTracker();

    // Case A: Request #1 (active: true) fails after rapid double click (false -> true -> false)
    let uiA: ReactionItem[] = [];
    const a1 = tracker.enqueue('post-1', '❤️', uiA)!;
    uiA = applyReactionActiveState(uiA, '❤️', a1.desiredActive);
    const a2 = tracker.enqueue('post-1', '❤️', uiA)!;
    uiA = applyReactionActiveState(uiA, '❤️', a2.desiredActive);

    const failA = tracker.fail('post-1', '❤️', a1.dispatch!.seq)!;
    assert.equal(failA.rollbackActive, false);
    uiA = applyReactionActiveState(uiA, '❤️', failA.rollbackActive);
    assert.deepEqual(uiA, []);

    // Case B: Request #1 (active: true) succeeds, then follow-up Request #2 (active: false) fails
    let uiB: ReactionItem[] = [];
    const b1 = tracker.enqueue('post-2', '❤️', uiB)!;
    uiB = applyReactionActiveState(uiB, '❤️', b1.desiredActive);
    const b2 = tracker.enqueue('post-2', '❤️', uiB)!;
    uiB = applyReactionActiveState(uiB, '❤️', b2.desiredActive);

    const s1 = tracker.settle('post-2', '❤️', b1.dispatch!.seq)!;
    assert.ok(s1.nextRequest);

    const failB = tracker.fail('post-2', '❤️', s1.nextRequest.seq)!;
    assert.equal(failB.rollbackActive, true);
    uiB = applyReactionActiveState(uiB, '❤️', failB.rollbackActive);
    assert.deepEqual(uiB, [{ emoji: '❤️', count: 1, reactedByMe: true }]);
  });

  it('coalesces 4 rapid async clicks via syncReactionMutation into at most two sequential requests', async () => {
    const tracker = createReactionMutationTracker();
    let ui: ReactionItem[] = [];
    const sentRequests: Array<{ emoji: string; active: boolean | undefined }> = [];
    const pendingResolvers: Array<() => void> = [];

    const requestFn: ToggleReactionRequestFn = (input) => {
      sentRequests.push({ emoji: input.emoji, active: input.active });
      return new Promise((resolve) => {
        pendingResolvers.push(() => {
          resolve({
            ok: true,
            data: {
              messageId: input.messageId,
              reactions: input.active
                ? [{ emoji: input.emoji, count: 1, reactedByMe: true }]
                : [],
            },
          });
        });
      });
    };

    const runClick = () =>
      syncReactionMutation({
        tracker,
        roomId: 'room-1',
        messageId: 'post-1',
        emoji: '❤️',
        currentReactions: ui,
        applyOptimisticActive: (active) => {
          ui = applyReactionActiveState(ui, '❤️', active);
        },
        applyResolvedReactions: (updater) => {
          ui = updater(ui);
        },
        onError: () => {},
        requestFn,
      });

    // 4 rapid clicks in a row while Request #1 is still pending
    const p1 = runClick(); // true -> sends #1
    const p2 = runClick(); // false -> coalesced
    const p3 = runClick(); // true -> coalesced
    const p4 = runClick(); // false -> coalesced

    assert.equal(sentRequests.length, 1);
    assert.deepEqual(sentRequests[0], { emoji: '❤️', active: true });
    assert.deepEqual(ui, []); // UI already reflects click #4 immediately
    assert.deepEqual(await Promise.all([p2, p3, p4]), [true, true, true]);

    // Finish Req #1 -> triggers single follow-up Req #2 (active: false)
    pendingResolvers[0]();
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(sentRequests.length, 2);
    assert.deepEqual(sentRequests[1], { emoji: '❤️', active: false });
    assert.deepEqual(ui, []);

    // Finish Req #2 -> converges cleanly
    pendingResolvers[1]();
    assert.equal(await p1, true);
    assert.deepEqual(ui, []);
  });

  it('merges other users reactions from latest snapshot while preserving pending optimistic deletes', () => {
    const tracker = createReactionMutationTracker();
    let ui: ReactionItem[] = [
      { emoji: '❤️', count: 1, reactedByMe: true },
    ];

    // User removes ❤️ and adds 👍 concurrently
    const remove = tracker.enqueue('post-1', '❤️', ui)!;
    ui = applyReactionActiveState(ui, '❤️', remove.desiredActive); // now []
    const add = tracker.enqueue('post-1', '👍', ui)!;
    ui = applyReactionActiveState(ui, '👍', add.desiredActive); // now [👍]

    // 👍 finishes first while ❤️ removal is still in-flight; another user added 🔥
    const settledAdd = tracker.settle('post-1', '👍', add.dispatch!.seq)!;
    ui = reconcileReactions({
      current: ui,
      serverReactions: [
        { emoji: '❤️', count: 1, reactedByMe: true },
        { emoji: '👍', count: 1, reactedByMe: true },
        { emoji: '🔥', count: 2, reactedByMe: false },
      ],
      toggledEmoji: '👍',
      pendingEmojis: settledAdd.pendingEmojis,
      applyExternalUpdates: settledAdd.applyExternalUpdates,
    });

    assert.deepEqual(ui, [
      { emoji: '👍', count: 1, reactedByMe: true },
      { emoji: '🔥', count: 2, reactedByMe: false },
    ]);

    // Now ❤️ removal finishes cleanly
    const settledRemove = tracker.settle('post-1', '❤️', remove.dispatch!.seq)!;
    ui = reconcileReactions({
      current: ui,
      serverReactions: [
        { emoji: '👍', count: 1, reactedByMe: true },
        { emoji: '🔥', count: 2, reactedByMe: false },
      ],
      toggledEmoji: '❤️',
      pendingEmojis: settledRemove.pendingEmojis,
      applyExternalUpdates: settledRemove.applyExternalUpdates,
    });

    assert.deepEqual(ui, [
      { emoji: '👍', count: 1, reactedByMe: true },
      { emoji: '🔥', count: 2, reactedByMe: false },
    ]);
  });

  it('reconcileReactions respects direct server removal when not pending and latest snapshot', () => {
    const result = reconcileReactions({
      current: [
        { emoji: '❤️', count: 1, reactedByMe: false },
        { emoji: '👍', count: 1, reactedByMe: true },
      ],
      serverReactions: [{ emoji: '👍', count: 2, reactedByMe: true }],
      toggledEmoji: '👍',
      pendingEmojis: new Set(),
      applyExternalUpdates: true,
    });

    assert.deepEqual(result, [{ emoji: '👍', count: 2, reactedByMe: true }]);
  });
});

describe('reaction server helpers', () => {
  it('applies explicit desiredActive idempotently with minimal store calls and keeps toggle fallback', async () => {
    let deleteCalls = 0;
    let createCalls = 0;

    // desiredActive: true skips deleteMany completely
    await applyReactionWithStore({
      desiredActive: true,
      deleteMany: async () => {
        deleteCalls++;
        return { count: 0 };
      },
      create: async () => {
        createCalls++;
      },
      findMany: async () => [{ emojiType: '❤️', userId: 'u1' }],
      isUniqueViolation: () => false,
    });
    assert.equal(deleteCalls, 0);
    assert.equal(createCalls, 1);

    // desiredActive: false skips create completely
    deleteCalls = 0;
    createCalls = 0;
    await applyReactionWithStore({
      desiredActive: false,
      deleteMany: async () => {
        deleteCalls++;
        return { count: 1 };
      },
      create: async () => {
        createCalls++;
      },
      findMany: async () => [],
      isUniqueViolation: () => false,
    });
    assert.equal(deleteCalls, 1);
    assert.equal(createCalls, 0);
  });
  it('verifies thread message ancestry without room-wide scan up to query depth and requests fallback only past depth', () => {
    const roomId = '11111111-1111-4111-8111-111111111111';
    const postId = '22222222-2222-4222-8222-222222222222';
    const otherPostId = '33333333-3333-4333-8333-333333333333';

    const rootTarget: AncestryNode = {
      id: postId,
      roomId,
      parentId: null,
      status: 'visible',
    };
    assert.equal(
      resolveThreadAncestryStatus({ postId, target: rootTarget, hasActiveRootPost: true }),
      'valid'
    );

    const hiddenAncestor: AncestryNode = {
      id: 'reply-1',
      roomId,
      parentId: 'comment-1',
      status: 'visible',
      parent: {
        id: 'comment-1',
        roomId,
        parentId: postId,
        status: 'hidden',
      },
    };
    assert.equal(
      resolveThreadAncestryStatus({ postId, target: hiddenAncestor, hasActiveRootPost: true }),
      'not_found'
    );

    const wrongThread: AncestryNode = {
      id: 'reply-other',
      roomId,
      parentId: otherPostId,
      status: 'visible',
      parent: {
        id: otherPostId,
        roomId,
        parentId: null,
        status: 'visible',
      },
    };
    assert.equal(
      resolveThreadAncestryStatus({ postId, target: wrongThread, hasActiveRootPost: true }),
      'not_found'
    );

    const truncatedDeepReply: AncestryNode = {
      id: 'reply-deep',
      roomId,
      parentId: 'ancestor-4',
      status: 'visible',
      parent: {
        id: 'ancestor-4',
        roomId,
        parentId: 'ancestor-3',
        status: 'visible',
      },
    };
    assert.equal(
      resolveThreadAncestryStatus({ postId, target: truncatedDeepReply, hasActiveRootPost: true }),
      'needs_fallback'
    );
  });

  it('toggles reactions lock-free and ignores unique constraint races on concurrent create', async () => {
    let createCalls = 0;
    const rowsAfterAdd = [{ emojiType: '❤️', userId: 'u1' }];

    // First toggle when absent -> deleteMany returns 0, create succeeds
    const res1 = await toggleReactionWithStore({
      deleteMany: async () => ({ count: 0 }),
      create: async () => {
        createCalls++;
      },
      findMany: async () => rowsAfterAdd,
      isUniqueViolation: () => false,
    });
    assert.equal(createCalls, 1);
    assert.deepEqual(res1, rowsAfterAdd);

    // Concurrent create unique violation (P2002) is treated idempotently
    const resRace = await toggleReactionWithStore({
      deleteMany: async () => ({ count: 0 }),
      create: async () => {
        throw { code: 'P2002' };
      },
      findMany: async () => rowsAfterAdd,
      isUniqueViolation: (err) =>
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: unknown }).code === 'P2002',
    });
    assert.deepEqual(resRace, rowsAfterAdd);

    // Delete hit -> skips create cleanly
    let skippedCreate = true;
    const resDelete = await toggleReactionWithStore({
      deleteMany: async () => ({ count: 1 }),
      create: async () => {
        skippedCreate = false;
      },
      findMany: async () => [],
      isUniqueViolation: () => false,
    });
    assert.equal(skippedCreate, true);
    assert.deepEqual(resDelete, []);
  });

  it('validates same-origin headers for mutation Route Handler CSRF safety', () => {
    assert.equal(
      isSameOriginMutationRequest({
        originHeader: 'https://antilonely.vercel.app',
        hostHeader: 'antilonely.vercel.app',
      }),
      true
    );
    assert.equal(
      isSameOriginMutationRequest({
        originHeader: 'http://localhost:3000',
        hostHeader: 'localhost:3000',
      }),
      true
    );
    assert.equal(
      isSameOriginMutationRequest({
        originHeader: 'https://evil.example',
        hostHeader: 'antilonely.vercel.app',
      }),
      false
    );
    assert.equal(
      isSameOriginMutationRequest({
        originHeader: 'null',
        hostHeader: 'localhost:3000',
      }),
      false
    );
    assert.equal(
      isSameOriginMutationRequest({
        originHeader: null,
        hostHeader: 'localhost:3000',
      }),
      true
    );
    assert.equal(
      isSameOriginMutationRequest({
        originHeader: null,
        hostHeader: 'localhost:3000',
        secFetchSiteHeader: 'cross-site',
      }),
      false
    );
    assert.equal(
      isSameOriginMutationRequest({
        originHeader: null,
        hostHeader: 'localhost:3000',
        secFetchSiteHeader: 'same-origin',
      }),
      true
    );
    assert.equal(isJsonMutationContentType('application/json; charset=utf-8'), true);
    assert.equal(isJsonMutationContentType('text/plain'), false);
    assert.equal(isJsonMutationContentType(null), false);
  });
});

describe('reaction failure recovery & sibling snapshot merging', () => {
  it('restores exact settled count from other users when a follow-up click fails', async () => {
    const tracker = createReactionMutationTracker();
    let ui: ReactionItem[] = [];
    const errors: string[] = [];

    let resolveFirst!: (value: {
      ok: true;
      data: { messageId: string; reactions: ReactionItem[] };
    }) => void;
    let callCount = 0;

    const requestFn: ToggleReactionRequestFn = () => {
      callCount += 1;
      if (callCount === 1) {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve({ ok: false, error: 'server down' });
    };

    const run = syncReactionMutation({
      tracker,
      roomId: 'room-1',
      messageId: 'post-1',
      emoji: '👍',
      currentReactions: ui,
      applyOptimisticActive: (active) => {
        ui = applyReactionActiveState(ui, '👍', active);
      },
      applyResolvedReactions: (updater) => {
        ui = updater(ui);
      },
      onError: (err) => errors.push(err),
      requestFn,
    });

    // Second click queues desiredActive=false before first settles
    await syncReactionMutation({
      tracker,
      roomId: 'room-1',
      messageId: 'post-1',
      emoji: '👍',
      currentReactions: ui,
      applyOptimisticActive: (active) => {
        ui = applyReactionActiveState(ui, '👍', active);
      },
      applyResolvedReactions: (updater) => {
        ui = updater(ui);
      },
      onError: (err) => errors.push(err),
      requestFn,
    });

    assert.deepEqual(ui, []);

    // First settles with count=3 (me + 2 other users); second fails and should restore count=3
    resolveFirst({
      ok: true,
      data: {
        messageId: 'post-1',
        reactions: [{ emoji: '👍', count: 3, reactedByMe: true }],
      },
    });

    const ok = await run;
    assert.equal(ok, false);
    assert.deepEqual(errors, ['server down']);
    assert.deepEqual(ui, [{ emoji: '👍', count: 3, reactedByMe: true }]);
  });

  it('restoreReactionSnapshot falls back cleanly when no server snapshot was settled yet', () => {
    assert.deepEqual(
      restoreReactionSnapshot(
        [{ emoji: '❤️', count: 1, reactedByMe: true }],
        '❤️',
        false,
        undefined
      ),
      []
    );
    assert.deepEqual(
      restoreReactionSnapshot(
        [{ emoji: '❤️', count: 1, reactedByMe: true }],
        '❤️',
        false,
        null
      ),
      []
    );
  });

  it('preserves both in-flight and recently settled reactions across thread snapshot merges', async () => {
    const tracker = createReactionMutationTracker();
    const baseThread: PostThread = {
      id: 'post-1',
      boardSlug: 'chill-room',
      boardName: 'Chill Room',
      author: { id: 'u1', name: 'A' },
      content: 'hello',
      createdAt: '2026-11-14T00:00:00.000Z',
      reactions: [],
      comments: [
        {
          id: 'comment-1',
          author: { id: 'u2', name: 'B' },
          isPostAuthor: false,
          content: 'first',
          createdAt: '2026-11-14T00:01:00.000Z',
          reactions: [{ emoji: '👍', count: 1, reactedByMe: false }],
          replies: [],
        },
      ],
    };

    const replyStartEpoch = tracker.getCurrentEpoch();
    let currentThread = baseThread;

    // 1) In-flight reaction on post-1 while createThreadReply is running
    const ePost = tracker.enqueue('post-1', '❤️', currentThread.reactions)!;
    currentThread = {
      ...currentThread,
      reactions: applyReactionActiveState(
        currentThread.reactions,
        '❤️',
        ePost.desiredActive
      ),
    };

    // 2) Settled reaction on comment-1 while createThreadReply is STILL in flight
    const eComment = tracker.enqueue(
      'comment-1',
      '😂',
      currentThread.comments[0].reactions
    )!;
    const settledServerCommentReactions: ReactionItem[] = [
      { emoji: '👍', count: 1, reactedByMe: false },
      { emoji: '😂', count: 1, reactedByMe: true },
    ];
    tracker.settle(
      'comment-1',
      '😂',
      eComment.dispatch!.seq,
      settledServerCommentReactions
    );
    currentThread = {
      ...currentThread,
      comments: [
        {
          ...currentThread.comments[0],
          reactions: settledServerCommentReactions,
        },
      ],
    };

    // Stale snapshot returned by createThreadReply (includes new comment-2, misses ❤️ and 😂)
    const incomingThread: PostThread = {
      ...baseThread,
      reactions: [],
      comments: [
        baseThread.comments[0],
        {
          id: 'comment-2',
          author: { id: 'u1', name: 'A' },
          isPostAuthor: true,
          content: 'new comment',
          createdAt: '2026-11-14T00:02:00.000Z',
          reactions: [{ emoji: '🔥', count: 1, reactedByMe: false }],
          replies: [],
        },
      ],
    };

    const merged = mergeThreadReactions({
      currentThread,
      incomingThread,
      tracker,
      sinceEpoch: replyStartEpoch,
    });

    assert.deepEqual(merged.reactions, [{ emoji: '❤️', count: 1, reactedByMe: true }]);
    assert.deepEqual(merged.comments[0].reactions, [
      { emoji: '👍', count: 1, reactedByMe: false },
      { emoji: '😂', count: 1, reactedByMe: true },
    ]);
    assert.equal(merged.comments[1].id, 'comment-2');

    // mergeIncomingReactions preserves pending emojis across prop refreshes too
    const refreshed = mergeIncomingReactions({
      tracker,
      targetId: 'post-1',
      currentReactions: currentThread.reactions,
      incomingReactions: [{ emoji: '😮', count: 2, reactedByMe: false }],
    });
    assert.deepEqual(refreshed, [
      { emoji: '❤️', count: 1, reactedByMe: true },
      { emoji: '😮', count: 2, reactedByMe: false },
    ]);
  });
});

describe('reaction service workflow & HTTP route handler', () => {
  const roomUuid = '11111111-1111-4111-8111-111111111111';
  const postUuid = '22222222-2222-4222-8222-222222222222';
  const deepReplyUuid = '33333333-3333-4333-8333-333333333333';
  const userUuid = '44444444-4444-4444-8444-444444444444';

  it('rejects arbitrary non-allowlisted emoji strings with 400 before touching DB', async () => {
    assert.equal(isSupportedReactionEmoji('❤️'), true);
    assert.equal(isSupportedReactionEmoji('🥹'), true);
    assert.equal(isSupportedReactionEmoji('not-an-emoji'), false);
    assert.equal(isSupportedReactionEmoji(''), false);

    let sessionChecked = false;
    const result = await executeToggleMessageReaction(
      {
        roomId: roomUuid,
        messageId: postUuid,
        emoji: 'hacked-text',
        active: true,
      },
      {
        getSessionUserId: async () => {
          sessionChecked = true;
          return userUuid;
        },
        loadContext: async () => {
          throw new Error('should not load context');
        },
        loadVisibleRoomReplies: async () => {
          throw new Error('should not scan replies');
        },
        createStoreForMessage: () => {
          throw new Error('should not touch store');
        },
      }
    );

    assert.equal(sessionChecked, false);
    assert.deepEqual(result, {
      ok: false,
      status: 400,
      error: 'อีโมจิไม่ถูกต้อง',
    });
  });

  it('enforces room membership before target existence and avoids room-wide scans for non-members', async () => {
    let fallbackScanCalled = false;

    const nonMemberResult = await executeToggleMessageReaction(
      {
        roomId: roomUuid,
        postId: postUuid,
        messageId: deepReplyUuid,
        emoji: '❤️',
        active: true,
      },
      {
        getSessionUserId: async () => userUuid,
        loadContext: async () => ({
          hasActiveSanction: false,
          room: {
            id: roomUuid,
            slug: 'secret-room',
            status: 'active',
            isPrivate: true,
          },
          memberStatus: null,
          hasActiveRootPost: true,
          target: {
            id: deepReplyUuid,
            roomId: roomUuid,
            parentId: '55555555-5555-4555-8555-555555555555',
            status: 'visible',
            parent: null,
          },
        }),
        loadVisibleRoomReplies: async () => {
          fallbackScanCalled = true;
          return [];
        },
        createStoreForMessage: () => {
          throw new Error('should not touch store');
        },
      }
    );

    assert.equal(nonMemberResult.ok, false);
    assert.equal(nonMemberResult.status, 403);
    assert.equal(fallbackScanCalled, false);
  });

  it('handles needs_fallback ancestry resolution cleanly for authorized members', async () => {
    let fallbackScanCalled = false;
    let createCalled = false;

    const result = await executeToggleMessageReaction(
      {
        roomId: roomUuid,
        postId: postUuid,
        messageId: deepReplyUuid,
        emoji: '❤️',
        active: true,
      },
      {
        getSessionUserId: async () => userUuid,
        loadContext: async () => ({
          hasActiveSanction: false,
          room: {
            id: roomUuid,
            slug: 'chill-room',
            status: 'active',
            isPrivate: false,
          },
          memberStatus: 'active',
          hasActiveRootPost: true,
          target: {
            id: deepReplyUuid,
            roomId: roomUuid,
            parentId: '55555555-5555-4555-8555-555555555555',
            status: 'visible',
            parent: null,
          },
        }),
        loadVisibleRoomReplies: async () => {
          fallbackScanCalled = true;
          return [
            {
              id: '55555555-5555-4555-8555-555555555555',
              parentId: postUuid,
              status: 'visible',
            },
            {
              id: deepReplyUuid,
              parentId: '55555555-5555-4555-8555-555555555555',
              status: 'visible',
            },
          ];
        },
        createStoreForMessage: () => ({
          deleteMany: async () => ({ count: 0 }),
          create: async () => {
            createCalled = true;
          },
          findMany: async () => [{ emojiType: '❤️', userId: userUuid }],
          isUniqueViolation: () => false,
        }),
      }
    );

    assert.equal(fallbackScanCalled, true);
    assert.equal(createCalled, true);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.data.reactions, [
        { emoji: '❤️', count: 1, reactedByMe: true },
      ]);
    }
  });

  it('validates HTTP CSRF/Content-Type/JSON and revalidates both room and thread paths on board reactions', async () => {
    const crossSiteRes = await handleToggleReactionHttp(
      new Request('https://antilonely.vercel.app/api/reactions/toggle', {
        method: 'POST',
        headers: {
          host: 'antilonely.vercel.app',
          origin: 'https://evil.example',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomUuid, messageId: postUuid, emoji: '❤️' }),
      }),
      {
        toggleReaction: async () => {
          throw new Error('should block CSRF');
        },
      }
    );
    assert.equal(crossSiteRes.status, 403);

    const wrongTypeRes = await handleToggleReactionHttp(
      new Request('https://antilonely.vercel.app/api/reactions/toggle', {
        method: 'POST',
        headers: {
          host: 'antilonely.vercel.app',
          origin: 'https://antilonely.vercel.app',
          'content-type': 'text/plain',
        },
        body: 'roomId=1',
      }),
      {
        toggleReaction: async () => {
          throw new Error('should reject non-json');
        },
      }
    );
    assert.equal(wrongTypeRes.status, 415);

    const revalidatedPaths: string[] = [];
    const okRes = await handleToggleReactionHttp(
      new Request('https://antilonely.vercel.app/api/reactions/toggle', {
        method: 'POST',
        headers: {
          host: 'antilonely.vercel.app',
          origin: 'https://antilonely.vercel.app',
          'sec-fetch-site': 'same-origin',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomUuid,
          messageId: postUuid,
          emoji: '❤️',
          active: true,
        }),
      }),
      {
        toggleReaction: async () => ({
          ok: true,
          status: 200,
          data: {
            messageId: postUuid,
            postId: postUuid,
            roomId: roomUuid,
            roomSlug: 'chill-room',
            emoji: '❤️',
            reactions: [{ emoji: '❤️', count: 1, reactedByMe: true }],
          },
        }),
        revalidatePath: (path) => {
          revalidatedPaths.push(path);
        },
      }
    );

    assert.equal(okRes.status, 200);
    assert.deepEqual(revalidatedPaths, [
      '/rooms/chill-room',
      `/rooms/${roomUuid}`,
      `/rooms/chill-room/posts/${postUuid}`,
      `/rooms/${roomUuid}/posts/${postUuid}`,
    ]);
  });

  it('requestToggleReaction handles non-JSON server errors gracefully without throwing', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () =>
        new Response('<html>Bad Gateway</html>', {
          status: 502,
          headers: { 'content-type': 'text/html' },
        })) as typeof fetch;

      const res = await requestToggleReaction({
        roomId: roomUuid,
        messageId: postUuid,
        emoji: '❤️',
        active: true,
      });

      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.error, 'ไม่สามารถอัปเดตรีแอคชันได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
