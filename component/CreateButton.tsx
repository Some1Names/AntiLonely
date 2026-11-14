"use client";

import { useState } from "react";
import { listMyRooms } from "@/app/home-actions";
import CreateModal, { type CreateTab } from "@/component/CreateModal";
import {
  useJoinedRooms,
  usePageSignedIn,
} from "@/component/RoomMembership";
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
  const onHome = usePageSignedIn() !== undefined;
  // Other pages pass whatever rooms they have, which may not be real ones,
  // so the modal asks the server which rooms you've joined each time it
  // opens there. Null while that's on its way.
  const [fetchedRooms, setFetchedRooms] = useState<MyRoom[] | null>(null);

  function openModal() {
    setOpen(true);
    if (onHome) return;
    setFetchedRooms(null);
    listMyRooms()
      .then(setFetchedRooms)
      .catch(() => setFetchedRooms([]));
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={openModal}
        className={className}
      >
        {children}
      </button>
      {open && (
        <CreateModal
          rooms={onHome ? joinedRooms : fetchedRooms}
          alias={alias}
          initialTab={tab}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
