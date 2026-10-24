"use client";

import { useState } from "react";
import RoomList from "@/component/RoomList";
import type { Room } from "@/lib/mock";
import { inputClass } from "@/lib/styles";

// The welcome note sits between the search bar and the room list it filters,
// so the search text lives here. The note comes in as children and stays a
// server component.
export default function HomeMain({
  rooms,
  memberRoomIds,
  children,
}: {
  rooms: Room[];
  memberRoomIds: string[];
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  return (
    <main className="flex min-w-0 flex-col gap-6">
      {/* Only rooms for now. Posts join in once there's a backend. */}
      <input
        type="search"
        aria-label="ค้นหาห้อง"
        placeholder="ค้นหาห้อง..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className={inputClass}
      />
      {children}
      <RoomList
        rooms={rooms}
        memberRoomIds={memberRoomIds}
        query={query}
        onClearQuery={() => setQuery("")}
      />
    </main>
  );
}
