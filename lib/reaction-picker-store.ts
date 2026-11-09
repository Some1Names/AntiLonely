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

export function useActiveReactionPicker(id: string): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
} {
  const activeId = useSyncExternalStore(
    reactionPickerStore.subscribe,
    reactionPickerStore.getSnapshot,
    () => null
  );

  const isOpen = activeId === id;

  const open = useCallback(() => {
    reactionPickerStore.open(id);
  }, [id]);

  const close = useCallback(() => {
    reactionPickerStore.close(id);
  }, [id]);

  return { isOpen, open, close };
}

