"use client";

import { useMemo, useSyncExternalStore } from "react";

// Notification ids the user has read, kept in the browser until there's a
// backend, so the bell in the navbar and the notifications page agree.
const KEY = "antilonely:read-notifications";
const EVENT = "antilonely:read-notifications-changed";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// Null until something has been read (and on the server).
export function useReadNotificationIds(): Set<string> | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return useMemo(() => {
    if (raw === null) return null;
    try {
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return null;
    }
  }, [raw]);
}

export function markNotificationsRead(ids: string[]) {
  try {
    const current = new Set<string>(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    ids.forEach((id) => current.add(id));
    localStorage.setItem(KEY, JSON.stringify([...current]));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}
