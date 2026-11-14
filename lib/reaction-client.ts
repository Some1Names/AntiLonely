import type { ActionResult } from './server-action-helpers.ts';
import type { ReactionItem } from '../types/post-thread.ts';
import {
  reconcileReactions,
  type ReactionMutationTracker,
  type ReactionSyncRequest,
} from './post-thread.ts';

export type ToggleReactionRequestInput = {
  roomId: string;
  postId?: string;
  messageId: string;
  emoji: string;
  active?: boolean;
};

export type ToggleReactionRequestResult = ActionResult<{
  messageId: string;
  reactions: ReactionItem[];
}>;

export type ToggleReactionRequestFn = (
  input: ToggleReactionRequestInput
) => Promise<ToggleReactionRequestResult>;

/**
 * Dispatches reaction updates over parallel fetch requests to the reaction
 * Route Handler instead of Next.js's sequentially queued Server Action channel.
 */
export async function requestToggleReaction(
  input: ToggleReactionRequestInput
): Promise<ToggleReactionRequestResult> {
  try {
    const response = await fetch('/api/reactions/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(input),
    });

    const payload = (await response.json()) as ToggleReactionRequestResult;

    if (!payload || typeof payload.ok !== 'boolean') {
      return {
        ok: false,
        error: 'ไม่สามารถอัปเดตรีแอคชันได้ กรุณาลองใหม่อีกครั้ง',
      };
    }

    return payload;
  } catch {
    return {
      ok: false,
      error: 'ไม่สามารถอัปเดตรีแอคชันได้ กรุณาลองใหม่อีกครั้ง',
    };
  }
}

/**
 * Immediately applies an optimistic reaction toggle and runs a single-flight
 * sync loop per (messageId, emoji) that coalesces rapid repeated clicks to the
 * user's latest desired state.
 */
export async function syncReactionMutation(input: {
  tracker: ReactionMutationTracker;
  roomId: string;
  postId?: string;
  messageId: string;
  emoji: string;
  currentReactions: readonly ReactionItem[];
  applyOptimisticActive: (desiredActive: boolean) => void;
  applyResolvedReactions: (
    updater: (current: readonly ReactionItem[]) => ReactionItem[]
  ) => void;
  onError: (message: string) => void;
  requestFn?: ToggleReactionRequestFn;
}): Promise<boolean> {
  const trimmedEmoji = input.emoji.trim();
  if (!trimmedEmoji) {
    return false;
  }

  const enqueued = input.tracker.enqueue(
    input.messageId,
    trimmedEmoji,
    input.currentReactions
  );
  if (!enqueued) {
    return false;
  }

  input.applyOptimisticActive(enqueued.desiredActive);

  let nextDispatch: ReactionSyncRequest | null = enqueued.dispatch;
  if (!nextDispatch) {
    // Another single-flight loop for this (messageId, emoji) is already active
    // and will synchronize the updated desiredActive state once it settles.
    return true;
  }

  const dispatchRequest = input.requestFn ?? requestToggleReaction;

  while (nextDispatch) {
    const currentDispatch = nextDispatch;
    try {
      const result = await dispatchRequest({
        roomId: input.roomId,
        postId: input.postId,
        messageId: input.messageId,
        emoji: trimmedEmoji,
        active: currentDispatch.active,
      });

      if (!result.ok) {
        const failed = input.tracker.fail(
          input.messageId,
          trimmedEmoji,
          currentDispatch.seq
        );
        if (failed) {
          input.applyOptimisticActive(failed.rollbackActive);
        }
        input.onError(result.error);
        return false;
      }

      const settlement = input.tracker.settle(
        input.messageId,
        trimmedEmoji,
        currentDispatch.seq
      );
      if (!settlement) {
        return true;
      }

      input.applyResolvedReactions((current) =>
        reconcileReactions({
          current,
          serverReactions: result.data.reactions,
          toggledEmoji: trimmedEmoji,
          pendingEmojis: settlement.pendingEmojis,
          applyExternalUpdates: settlement.applyExternalUpdates,
        })
      );

      nextDispatch = settlement.nextRequest;
    } catch {
      const failed = input.tracker.fail(
        input.messageId,
        trimmedEmoji,
        currentDispatch.seq
      );
      if (failed) {
        input.applyOptimisticActive(failed.rollbackActive);
      }
      input.onError('ไม่สามารถอัปเดตรีแอคชันได้ กรุณาลองใหม่อีกครั้ง');
      return false;
    }
  }

  return true;
}
