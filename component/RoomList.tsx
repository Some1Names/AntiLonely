"use client";

import { useRef, useState } from "react";
import EmptyRooms from "@/component/EmptyRooms";
import RoomCard from "@/component/RoomCard";
import type { Room } from "@/lib/mock";
import { roomMatchesQuery } from "@/lib/search";
import { highlightClass } from "@/lib/styles";

const filters = [
  { id: "all", label: "ทั้งหมด" },
  { id: "new", label: "มาใหม่" },
  { id: "private", label: "ส่วนตัว" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function matchesFilter(room: Room, filter: FilterId) {
  if (filter === "new") return room.isNew;
  if (filter === "private") return room.isPrivate;
  return true;
}

export default function RoomList({
  rooms,
  memberRoomIds,
  query,
  onClearQuery,
}: {
  rooms: Room[];
  memberRoomIds: string[];
  query: string;
  onClearQuery: () => void;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const allFilterRef = useRef<HTMLButtonElement>(null);
  const search = query.trim();
  const shown = rooms.filter(
    (room) => matchesFilter(room, filter) && roomMatchesQuery(room, search),
  );

  // The empty state's button goes away once pressed, so focus moves to the
  // ทั้งหมด filter, which is the pressed one again.
  function reset() {
    setFilter("all");
    onClearQuery();
    allFilterRef.current?.focus();
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold">
            <span
              className={`${highlightClass} [--mark:var(--color-peach-edge)]`}
            >
              ห้องน่าแวะ
            </span>
          </h2>
          {/* Always rendered so screen readers pick up changes. With no
              results the empty card says it on screen, so here it's only
              read out. */}
          <p
            role="status"
            className={`text-sm text-ink-soft ${shown.length === 0 ? "sr-only" : ""}`}
          >
            {search &&
              (shown.length > 0
                ? `เจอ ${shown.length} ห้อง`
                : `ไม่เจอห้องที่ตรงกับ “${search}”`)}
          </p>
        </div>
        <div className="flex gap-2">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              ref={id === "all" ? allFilterRef : undefined}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`rounded-md border-[1.5px] px-3 py-1 text-sm ${
                filter === id
                  ? "border-kmutt-orange-dark bg-kmutt-orange-dark font-semibold text-white"
                  : "border-edge-strong bg-white hover:bg-butter"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {shown.length > 0 ? (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {shown.map((room) => (
              <li key={room.id}>
                <RoomCard
                  room={room}
                  isMember={memberRoomIds.includes(room.id)}
                />
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="self-center py-2 text-sm font-semibold text-kmutt-orange-dark underline-offset-4 hover:underline"
          >
            ดูห้องเพิ่ม
          </button>
        </>
      ) : (
        <EmptyRooms query={search} onReset={reset} />
      )}
    </section>
  );
}
