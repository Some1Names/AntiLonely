"use client";

import { createContext, use, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import LeaveRoomModal from "@/component/LeaveRoomModal";
import {
  joinedRooms as listJoinedRooms,
  joinRoom,
  leaveRoom,
  membershipFrom,
  membershipStatus,
  membershipStorageKey,
  type Membership,
  type MembershipStatus,
} from "@/lib/membership";
import type { MyRoom, Room } from "@/lib/mock";

type RoomMembershipValue = {
  // Every room, for the random draw.
  rooms: Room[];
  membership: Membership;
  // "ห้องของฉัน" as it stands now.
  joinedRooms: MyRoom[];
  statusOf: (roomId: string) => MembershipStatus | null;
  join: (room: Room) => void;
  cancelRequest: (roomId: string) => void;
  // Opens the leave modal; the room is only left once it's confirmed.
  askToLeave: (room: Room) => void;
};

const RoomMembershipContext = createContext<RoomMembershipValue | null>(null);

export function useRoomMembership() {
  const value = use(RoomMembershipContext);
  if (!value) {
    throw new Error("useRoomMembership needs a <RoomMembership> above it");
  }
  return value;
}

// Which rooms you've joined or asked to join, shared by Home's room cards,
// sidebar and modals. It starts from the mock "ห้องของฉัน" and isn't saved
// anywhere yet, so a reload starts over. The leave modal renders here rather
// than in the card that asked for it: cards tilt on hover, and a transformed
// parent would pin the modal's fixed overlay to the card.
export default function RoomMembership({
  myRooms,
  rooms,
  children,
}: {
  myRooms: MyRoom[];
  rooms: Room[];
  children: React.ReactNode;
}) {
  const [membership, setMembership] = useState(() => membershipFrom(myRooms));
  const [leaving, setLeaving] = useState<Room | null>(null);
  const userId = authClient.useSession().data?.user.id;
  const storageKey = userId ? membershipStorageKey(userId) : null;
  // Which user's saved membership is already loaded, so we don't save the
  // starting mock list over it before it has been read.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // Once we know who is signed in, pick up what they joined last time.
  useEffect(() => {
    if (!storageKey) return;
    let cancelled = false;
    // Deferred so the state update isn't synchronous inside the effect.
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setMembership(JSON.parse(saved) as Membership);
      } catch {
        // Storage blocked or corrupt: keep the starting list.
      }
      setLoadedKey(storageKey);
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || loadedKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(membership));
    } catch {
      // Not saved; membership still works for this visit.
    }
  }, [membership, storageKey, loadedKey]);

  const value: RoomMembershipValue = {
    rooms,
    membership,
    joinedRooms: listJoinedRooms(myRooms, rooms, membership),
    statusOf: (roomId) => membershipStatus(membership, roomId),
    join: (room) => setMembership((current) => joinRoom(current, room)),
    cancelRequest: (roomId) =>
      setMembership((current) => leaveRoom(current, roomId)),
    askToLeave: setLeaving,
  };

  return (
    <RoomMembershipContext value={value}>
      {children}
      {leaving && (
        <LeaveRoomModal
          room={leaving}
          onClose={() => setLeaving(null)}
          onLeave={() =>
            setMembership((current) => leaveRoom(current, leaving.id))
          }
        />
      )}
    </RoomMembershipContext>
  );
}
