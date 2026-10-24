"use client";

import { useState } from "react";
import RoomCard from "@/component/RoomCard";
import type { Room } from "@/lib/mock";

const filters = [
  { id: "all", label: "ทั้งหมด" },
  { id: "new", label: "มาใหม่" },
  { id: "private", label: "ส่วนตัว" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function matches(room: Room, filter: FilterId) {
  if (filter === "new") return room.isNew;
  if (filter === "private") return room.isPrivate;
  return true;
}

export default function RoomList({ rooms }: { rooms: Room[] }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const shown = rooms.filter((room) => matches(room, filter));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">ห้องน่าแวะ</h2>
        <div className="flex gap-2">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                filter === id
                  ? "border-zinc-800 bg-zinc-800 text-white"
                  : "border-zinc-300 bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {shown.map((room) => (
          <li key={room.id}>
            <RoomCard room={room} />
          </li>
        ))}
      </ul>
      <button type="button" className="self-center py-2 text-sm text-zinc-600">
        ดูห้องเพิ่ม
      </button>
    </section>
  );
}
