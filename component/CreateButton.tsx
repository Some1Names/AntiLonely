"use client";

import { useState } from "react";
import CreateModal, { type CreateTab } from "@/component/CreateModal";
import { useJoinedRooms } from "@/component/RoomMembership";
import type { MyRoom } from "@/types/room";

// Opens the create modal on a given tab. Lets server components (Header,
// Sidebar) place the button without becoming client components.
export default function CreateButton({
  rooms,
  alias,
  tab = "post",
  className,
  children,
}: {
  rooms: MyRoom[];
  alias: string;
  tab?: CreateTab;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // On Home the list follows what you join and leave.
  const joinedRooms = useJoinedRooms(rooms);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      {open && (
        <CreateModal
          rooms={joinedRooms}
          alias={alias}
          initialTab={tab}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
