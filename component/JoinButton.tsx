"use client";

import Icon from "@/component/Icon";
import { useRoomMembership } from "@/component/RoomMembership";
import type { Room } from "@/lib/mock";
import { primaryButtonClass } from "@/lib/styles";

// Private rooms need a request instead of joining straight away. Once
// pressed, the sticker stays pressed in and turns peach, with a check
// (joined) or a clock (waiting for the request). Pressing it again takes a
// request back at once, but asks first before leaving a room.
export default function JoinButton({ room }: { room: Room }) {
  const { statusOf, join, cancelRequest, askToLeave } = useRoomMembership();
  const status = statusOf(room.id);

  const label =
    status === "joined"
      ? "เข้าร่วมแล้ว"
      : status === "requested"
        ? "ส่งคำขอแล้ว"
        : room.isPrivate
          ? "ขอเข้าร่วม"
          : "เข้าร่วม";

  function press() {
    if (status === "joined") askToLeave(room);
    else if (status === "requested") cancelRequest(room.id);
    else join(room);
  }

  return (
    <button
      type="button"
      aria-pressed={status !== null}
      aria-haspopup={status === "joined" ? "dialog" : undefined}
      onClick={press}
      className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 ${
        status === null
          ? primaryButtonClass
          : "translate-0.5 rounded-lg border-[1.5px] border-peach-edge bg-peach text-sm font-semibold text-kmutt-orange-dark hover:bg-peach-edge/50"
      }`}
    >
      {status === "joined" && <Icon name="check" className="size-4" />}
      {status === "requested" && <Icon name="clock" className="size-4" />}
      {label}
    </button>
  );
}
