"use client";

import { useEffect, useState } from "react";
import {
  joinedCount,
  membershipFrom,
  membershipStorageKey,
  type Membership,
} from "@/lib/membership";
import { myRooms } from "@/lib/mock";

// The number of rooms this user has joined, read from what the home page
// saved. Falls back to the starting mock list until something is saved.
export function useJoinedCount(userId: string | undefined) {
  const [count, setCount] = useState(() => joinedCount(membershipFrom(myRooms)));

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(membershipStorageKey(userId));
        if (saved) setCount(joinedCount(JSON.parse(saved) as Membership));
      } catch {
        // Keep the starting count.
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return count;
}
