"use client";

import { useState } from "react";
import Icon from "@/component/Icon";
import RoomList from "@/component/RoomList";
import type { Room } from "@/types/room";
import { fieldFrameClass } from "@/lib/styles";

// The welcome note sits between the search bar and the room list it filters,
// so the search text lives here. The note comes in as children and stays a
// server component.
export default function HomeMain({
  rooms,
  children,
}: {
  rooms: Room[];
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  return (
    <main className="flex min-w-0 flex-col gap-6">
      {/* Only rooms for now. Posts join in once there's a backend. */}
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft"
        />
        <input
          type="search"
          aria-label="ค้นหาห้อง"
          placeholder="ค้นหาห้อง..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={`py-2.5 pl-10 pr-3 shadow-[3px_3px_0_var(--color-edge)] ${fieldFrameClass}`}
        />
      </div>
      {children}
      <RoomList
        rooms={rooms}
        query={query}
        onClearQuery={() => setQuery("")}
      />
    </main>
  );
}
