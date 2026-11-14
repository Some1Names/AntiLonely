"use client";

import Icon from "@/component/Icon";
import Modal from "@/component/Modal";
import Sheet from "@/component/Sheet";
import { DEFAULT_ROOM_EMOJI } from "@/lib/room-board";
import type { Room } from "@/types/room";
import {
  outlineButtonClass,
  roomLook,
  secondaryButtonClass,
} from "@/lib/styles";

// A small sheet asked before leaving a room you've joined. Leaving is easy to
// take back for a public room, so "ออกจากห้อง" is a white sticker, not red;
// a private room says you'd have to ask to join again.
export default function LeaveRoomModal({
  room,
  onClose,
  onLeave,
}: {
  room: Room;
  onClose: () => void;
  onLeave: () => void;
}) {
  const { tile } = roomLook(room);

  return (
    <Modal labelledBy="leave-title" onClose={onClose} sheetName="leave-sheet">
      <Sheet titleId="leave-title" title="ออกจากห้องนี้ไหม?">
        <div className="flex items-center gap-3 rounded-lg border-[1.5px] border-dashed border-edge-strong bg-cream px-3 py-2.5">
          <span
            aria-hidden="true"
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg border-[1.5px] text-xl ${tile}`}
          >
            {room.emoji ?? DEFAULT_ROOM_EMOJI}
          </span>
          <p className="min-w-0 truncate font-display text-lg font-semibold">
            {room.name}
          </p>
        </div>

        <p className="mt-4 text-sm text-ink-soft">
          {room.isPrivate
            ? "ห้องนี้จะหายไปจาก “ห้องของฉัน”"
            : "ห้องนี้จะหายไปจาก “ห้องของฉัน” อยากกลับมาเมื่อไหร่ก็กดเข้าร่วมใหม่ได้เลย"}
        </p>
        {room.isPrivate && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-mist-ink">
            <Icon name="lock" className="mt-0.5 size-4" />
            เป็นห้องส่วนตัว ถ้าอยากกลับมาต้องส่งคำขอเข้าร่วมใหม่อีกครั้ง
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 ${secondaryButtonClass}`}
          >
            อยู่ต่อ
          </button>
          <button
            type="button"
            onClick={() => {
              onLeave();
              onClose();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 ${outlineButtonClass}`}
          >
            <Icon name="logout" className="size-4" />
            ออกจากห้อง
          </button>
        </div>
      </Sheet>
    </Modal>
  );
}
