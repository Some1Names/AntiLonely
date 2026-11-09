"use client";

import Link from "next/link";
import CreateButton from "@/component/CreateButton";
import Icon from "@/component/Icon";
import RandomRoomButton from "@/component/RandomRoom";
import { useRoomMembership } from "@/component/RoomMembership";
import { defaultRoomEmoji, type MyRoom } from "@/lib/mock";
import { indexCardClass, outlineButtonClass } from "@/lib/styles";

// Room icons sit on pastel paper squares. Private rooms are always blue grey
// to match their tag; the rest alternate.
const tileColors = ["border-butter-edge bg-butter", "border-peach-edge bg-peach"];

// An index card down the side: the rooms you've joined, which change as you
// join and leave, then ways to find more. `rooms` is the starting list the
// create modal offers.
export default function Sidebar({
  rooms,
  alias,
}: {
  rooms: MyRoom[];
  alias: string;
}) {
  const { joinedRooms } = useRoomMembership();

  return (
    <nav
      aria-labelledby="my-rooms-label"
      className={`flex flex-col gap-1 self-start p-3 ${indexCardClass}`}
    >
      <p
        id="my-rooms-label"
        className="mb-1 border-b-[1.5px] border-dashed border-edge px-2 pb-2 font-display font-semibold"
      >
        ห้องของฉัน
      </p>
      {joinedRooms.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {joinedRooms.map((room, index) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-butter/70"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg border text-base group-hover:-rotate-6 motion-safe:transition-transform ${
                    room.isPrivate
                      ? "border-edge-strong bg-mist"
                      : tileColors[index % tileColors.length]
                  }`}
                >
                  {room.emoji ?? defaultRoomEmoji}
                </span>
                <span className="flex-1 truncate">{room.name}</span>
                {room.unread > 0 ? (
                  <span className="rounded-full bg-kmutt-orange-dark px-2 text-xs font-semibold leading-5 text-white">
                    {room.unread}
                  </span>
                ) : room.isPrivate ? (
                  <span className="flex items-center gap-1 rounded-full bg-mist px-2 text-xs leading-5 text-mist-ink">
                    <Icon name="lock" className="size-3" />
                    ส่วนตัว
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 py-1.5 text-sm text-ink-soft">
          ยังไม่ได้เข้าห้องไหนเลย ลองสุ่มดูไหม
        </p>
      )}
      <CreateButton
        rooms={rooms}
        alias={alias}
        tab="room"
        className="group flex items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm text-ink-soft hover:bg-butter/70 hover:text-ink"
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-dashed border-edge-strong group-hover:border-ink-soft"
        >
          <Icon name="plus" className="size-4" />
        </span>
        สร้างห้องใหม่
      </CreateButton>
      <RandomRoomButton
        className={`group mt-2 flex items-center justify-center gap-2 px-3 py-2 ${outlineButtonClass}`}
      >
        <Icon
          name="dice"
          className="size-4.5 group-hover:rotate-[20deg] motion-safe:transition-transform motion-safe:duration-300"
        />
        สุ่มห้องเลย
      </RandomRoomButton>
    </nav>
  );
}
