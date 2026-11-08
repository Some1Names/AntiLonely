"use client";

import {
  ViewTransition,
  addTransitionType,
  startTransition,
  useRef,
  useState,
} from "react";
import EmptyRooms from "@/component/EmptyRooms";
import Icon from "@/component/Icon";
import RoomCard from "@/component/RoomCard";
import type { Room } from "@/lib/mock";
import { roomMatchesQuery } from "@/lib/search";
import { highlightClass } from "@/lib/styles";

const filters = [
  { id: "all", label: "ทั้งหมด", icon: null },
  { id: "new", label: "มาใหม่", icon: "sparkle" },
  { id: "private", label: "ส่วนตัว", icon: "lock" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function matchesFilter(room: Room, filter: FilterId) {
  if (filter === "new") return room.isNew;
  if (filter === "private") return room.isPrivate;
  return true;
}

// Cards only animate in a transition tagged "room-filter". Other transitions,
// like the navigation that opens the login modal, leave them alone. Typing in
// search isn't a transition at all, so the cards update instantly there.
function onFilterChange(className: string) {
  return { "room-filter": className, default: "none" };
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

  function changeFilter(update: () => void) {
    startTransition(() => {
      addTransitionType("room-filter");
      update();
    });
  }

  // The empty state's button goes away once pressed, so focus moves to the
  // ทั้งหมด filter, which is the pressed one again.
  function reset() {
    changeFilter(() => {
      setFilter("all");
      onClearQuery();
    });
    allFilterRef.current?.focus();
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            <span
              className={`${highlightClass} [--mark:var(--color-peach-edge)] [--mark-delay:450ms]`}
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
        {/* Sticker toggles: the chosen one is pressed in, yellow and flat. */}
        <div className="flex gap-2">
          {filters.map(({ id, label, icon }) => (
            <button
              key={id}
              ref={id === "all" ? allFilterRef : undefined}
              type="button"
              aria-pressed={filter === id}
              onClick={() => changeFilter(() => setFilter(id))}
              className="flex items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-white px-3.5 py-1 text-sm font-medium shadow-sticker hover:bg-butter aria-pressed:translate-0.5 aria-pressed:bg-kmutt-yellow aria-pressed:shadow-none motion-safe:transition-[translate,box-shadow,background-color] motion-safe:duration-100"
            >
              {icon && <Icon name={icon} className="size-3.5" />}
              {label}
            </button>
          ))}
        </div>
      </div>
      {shown.length > 0 ? (
        <>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {shown.map((room) => (
              <ViewTransition
                key={room.id}
                enter={onFilterChange("room-in")}
                exit={onFilterChange("room-out")}
                default={onFilterChange("room-move")}
              >
                <li>
                  <RoomCard
                    room={room}
                    isMember={memberRoomIds.includes(room.id)}
                  />
                </li>
              </ViewTransition>
            ))}
          </ul>
          <button
            type="button"
            className="group flex items-center gap-1.5 self-center rounded-full px-4 py-2 text-sm font-semibold text-kmutt-orange-dark hover:bg-peach/70"
          >
            ดูห้องเพิ่ม
            <Icon
              name="chevron-down"
              className="size-4 group-hover:translate-y-0.5 motion-safe:transition-transform"
            />
          </button>
        </>
      ) : (
        <EmptyRooms query={search} onReset={reset} />
      )}
    </section>
  );
}
