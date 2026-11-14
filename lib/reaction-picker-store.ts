import { useCallback, useSyncExternalStore } from 'react';

let activePickerId: string | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore subscriber error
    }
  });
}

export const reactionPickerStore = {
  open(id: string): void {
    if (activePickerId !== id) {
      activePickerId = id;
      notify();
    }
  },

  close(id?: string): void {
    if (id === undefined || activePickerId === id) {
      if (activePickerId !== null) {
        activePickerId = null;
        notify();
      }
    }
  },

  getSnapshot(): string | null {
    return activePickerId;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

const subscribeServer = () => false;

export function useActiveReactionPicker(id: string): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
} {
  const getIsOpenSnapshot = useCallback(
    () => reactionPickerStore.getSnapshot() === id,
    [id]
  );

  // Return a boolean snapshot per picker id so opening or closing one picker
  // only re-renders the affected picker(s) instead of every ReactionBar on page.
  const isOpen = useSyncExternalStore(
    reactionPickerStore.subscribe,
    getIsOpenSnapshot,
    subscribeServer
  );

  const open = useCallback(() => {
    reactionPickerStore.open(id);
  }, [id]);

  const close = useCallback(() => {
    reactionPickerStore.close(id);
  }, [id]);

  return { isOpen, open, close };
}

