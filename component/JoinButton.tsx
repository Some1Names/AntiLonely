"use client";

import Icon from "@/component/Icon";
import { useRoomMembership } from "@/component/RoomMembership";
import { primaryButtonClass } from "@/lib/styles";
import type { Room } from "@/types/room";

// Once joined, the sticker stays pressed in and turns peach with a check.
// Pressing it again asks first before leaving the room. A private room can't
// be joined from here yet: pressing says what it needs.
export default function JoinButton({ room }: { room: Room }) {
  const { isJoined, join, askToLeave } = useRoomMembership();
  const joined = isJoined(room.id);

  return (
    <button
      type="button"
      aria-pressed={joined}
      aria-haspopup={joined ? "dialog" : undefined}
      onClick={() => (joined ? askToLeave(room) : join(room))}
      className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 ${
        joined
          ? "translate-0.5 rounded-lg border-[1.5px] border-peach-edge bg-peach text-sm font-semibold text-kmutt-orange-dark hover:bg-peach-edge/50"
          : primaryButtonClass
      }`}
    >
      {joined && <Icon name="check" className="size-4" />}
      {joined ? "เข้าร่วมแล้ว" : room.isPrivate ? "ขอเข้าร่วม" : "เข้าร่วม"}
    </button>
  );
}
