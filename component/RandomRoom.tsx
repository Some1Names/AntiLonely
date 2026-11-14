"use client";

import { useState } from "react";
import EmptyNote from "@/component/EmptyNote";
import Icon from "@/component/Icon";
import Modal from "@/component/Modal";
import { RoomStats, RoomTags } from "@/component/RoomCard";
import { useRoomMembership } from "@/component/RoomMembership";
import Sheet from "@/component/Sheet";
import Tape from "@/component/Tape";
import { pickRandomRoom, roomsToDiscover } from "@/lib/membership";
import { DEFAULT_ROOM_EMOJI } from "@/lib/room-board";
import type { Room } from "@/types/room";
import {
  disabledButtonClass,
  hintClass,
  outlineButtonClass,
  primaryButtonClass,
  roomLook,
} from "@/lib/styles";

// "สุ่มห้องเลย": draws a room you haven't joined, shows it, and asks whether
// to join it or draw again. Private rooms are left out: they can't be joined
// from here. Signed out, the button opens log in instead.
export default function RandomRoomButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const {
    rooms: allRooms,
    membership,
    signedIn,
    askToSignIn,
  } = useRoomMembership();
  const rooms = allRooms.filter((room) => !room.isPrivate);
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  // Counts draws, so each one replays the card's drop-in and turns the dice.
  const [draws, setDraws] = useState(0);

  function draw(currentId?: string) {
    setRoom(pickRandomRoom(rooms, membership, currentId));
    setDraws((count) => count + 1);
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          if (!signedIn) {
            askToSignIn();
            return;
          }
          draw();
          setOpen(true);
        }}
        className={className}
      >
        {children}
      </button>
      {open && (
        <RandomRoomModal
          room={room}
          draws={draws}
          canDrawAgain={roomsToDiscover(rooms, membership).length > 1}
          onDrawAgain={() => draw(room?.id)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function RandomRoomModal({
  room,
  draws,
  canDrawAgain,
  onDrawAgain,
  onClose,
}: {
  room: Room | null;
  draws: number;
  canDrawAgain: boolean;
  onDrawAgain: () => void;
  onClose: () => void;
}) {
  const { join } = useRoomMembership();

  return (
    <Modal labelledBy="random-title" onClose={onClose} sheetName="random-sheet">
      <Sheet titleId="random-title" title={room ? "สุ่มได้ห้องนี้!" : "สุ่มห้อง"}>
        {room ? (
          <>
            {/* Read out again on every draw. */}
            <div aria-live="polite">
              <RoomPreview key={draws} room={room} />
            </div>
            {!canDrawAgain && (
              <p className={`mt-4 ${hintClass}`}>
                เหลือห้องนี้ห้องเดียวที่ยังไม่ได้เข้านะ
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onDrawAgain}
                disabled={!canDrawAgain}
                className={`flex items-center gap-1.5 px-4 py-2 ${outlineButtonClass} ${disabledButtonClass}`}
              >
                <span
                  aria-hidden="true"
                  style={{ rotate: `${draws * 90}deg` }}
                  className="flex motion-safe:transition-[rotate] motion-safe:duration-300"
                >
                  <Icon name="dice" className="size-4" />
                </span>
                สุ่มใหม่
              </button>
              <button
                type="button"
                onClick={() => {
                  join(room);
                  onClose();
                }}
                className={`px-4 py-2 ${primaryButtonClass}`}
              >
                เข้าร่วม
              </button>
            </div>
          </>
        ) : (
          <EmptyNote
            icon="dice"
            title="ไม่มีห้องให้สุ่มแล้ว"
            description="คุณเข้าร่วมครบทุกห้องที่เปิดให้เข้าแล้ว ไว้มีห้องใหม่ ๆ ค่อยมาสุ่มกันนะ"
          >
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 px-4 py-2 ${primaryButtonClass}`}
            >
              โอเค
            </button>
          </EmptyNote>
        )}
      </Sheet>
    </Modal>
  );
}

// The drawn room as a little card in its color, dropped onto the sheet. It
// has no link or join button of its own: the sheet's buttons do that.
function RoomPreview({ room }: { room: Room }) {
  const { card, tile, tape } = roomLook(room);

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-xl border-[1.5px] border-ink bg-white p-4 pt-5 shadow-[4px_4px_0_var(--tone)] motion-safe:animate-sheet-drop ${card}`}
    >
      <Tape className={`h-5 w-14 ${tape}`} />
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex size-12 shrink-0 items-center justify-center rounded-lg border-[1.5px] text-2xl ${tile}`}
        >
          {room.emoji ?? DEFAULT_ROOM_EMOJI}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold leading-snug">
              {room.name}
            </h3>
            <RoomTags room={room} />
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">{room.description}</p>
        </div>
      </div>
      <div className="border-t-[1.5px] border-dashed border-edge pt-3">
        <RoomStats room={room} />
      </div>
    </div>
  );
}
