"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { postToRoom } from "@/app/home-actions";
import { validatePostContent } from "@/lib/room-board";
import type { MyRoom } from "@/types/room";

// Posting a thread from Home's welcome note or the create modal. `pending`
// stays on from the press until the new thread's page has opened, a second
// press meanwhile is ignored, and a refusal comes back as the server's Thai
// message in `error`, with what was typed left alone so it can be retried.
export function usePostToRoom() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Set at once on press, before React has re-rendered with `pending`.
  const sending = useRef(false);

  function post({
    room,
    content,
    onPosted,
  }: {
    room: MyRoom;
    content: string;
    // Runs once the post is saved, before going to it: clear the text,
    // close the modal.
    onPosted?: () => void;
  }) {
    if (sending.current) return;
    // Empty or too long: the server's own check and words, without the trip.
    const checked = validatePostContent(content);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    sending.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await postToRoom({ roomId: room.id, content });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        // After an await the transition has to be started again for the
        // navigation to count as still pending. `onPosted` goes in it too,
        // so the text clears and the modal closes as the thread appears,
        // not before.
        startTransition(() => {
          onPosted?.();
          router.push(`/rooms/${room.slug ?? room.id}/posts/${result.postId}`);
        });
      } catch {
        setError("ตั้งกระทู้ไม่สำเร็จ ลองใหม่อีกครั้งนะ");
      } finally {
        sending.current = false;
      }
    });
  }

  return { post, pending, error, clearError: () => setError(null) };
}
