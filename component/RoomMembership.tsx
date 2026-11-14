"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  use,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { changeRoomMembership } from "@/app/home-actions";
import Icon from "@/component/Icon";
import LeaveRoomModal from "@/component/LeaveRoomModal";
import {
  joinedRooms as listJoinedRooms,
  joinRoom,
  leaveRoom,
  membershipFrom,
  membershipStatus,
  type Membership,
} from "@/lib/membership";
import type { MyRoom, Room } from "@/types/room";

type RoomMembershipValue = {
  // Every room, for the random draw.
  rooms: Room[];
  membership: Membership;
  // "ห้องของฉัน" as it stands now.
  joinedRooms: MyRoom[];
  isJoined: (roomId: string) => boolean;
  // A join or leave for this room is still being saved.
  isSaving: (roomId: string) => boolean;
  join: (room: Room) => void;
  // Opens the leave modal; the room is only left once it's confirmed.
  askToLeave: (room: Room) => void;
  // Whether the page was loaded for someone signed in. It's the server's
  // answer, so it catches up with logging in and out when the forms refresh
  // the page, and the welcome note, the random room button and the header's
  // bell all switch together.
  signedIn: boolean;
  // Opens the log in modal over the page.
  askToSignIn: () => void;
};

const RoomMembershipContext = createContext<RoomMembershipValue | null>(null);

export function useRoomMembership() {
  const value = use(RoomMembershipContext);
  if (!value) {
    throw new Error("useRoomMembership needs a <RoomMembership> above it");
  }
  return value;
}

// "ห้องของฉัน" as it stands now, for parts that also render on pages without
// a <RoomMembership> (the header's create button); those get `fallback`.
export function useJoinedRooms(fallback: MyRoom[]) {
  return use(RoomMembershipContext)?.joinedRooms ?? fallback;
}

// Home's signed-in answer (see `signedIn` above), or undefined on pages without
// a <RoomMembership>, which have to ask the session instead.
export function usePageSignedIn() {
  return use(RoomMembershipContext)?.signedIn;
}

type Change = { room: Room; action: "join" | "leave" };

// Which rooms you've joined, shared by Home's room cards, sidebar and modals.
// `myRooms` comes from the database; joining and leaving saves there, and the
// page shows the change straight away while that is on its way. The leave
// modal renders here rather than in the card that asked for it: cards tilt on
// hover, and a transformed parent would pin the modal's fixed overlay to the
// card.
export default function RoomMembership({
  myRooms,
  rooms,
  signedIn,
  children,
}: {
  myRooms: MyRoom[];
  rooms: Room[];
  signedIn: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  // Goes back to what the database says once the save has finished.
  const [membership, showChange] = useOptimistic(
    membershipFrom(myRooms),
    (current: Membership, { room, action }: Change) =>
      action === "join"
        ? joinRoom(current, { id: room.id, isPrivate: false })
        : leaveRoom(current, room.id),
  );
  // Rooms with a save on its way. It clears itself once the save and the
  // refreshed page are in, like the membership above.
  const [saving, markSaving] = useOptimistic(
    [] as string[],
    (ids: string[], roomId: string) => [...ids, roomId],
  );
  const [, startTransition] = useTransition();
  const [leaving, setLeaving] = useState<Room | null>(null);
  // Why the last join or leave didn't go through.
  const [problem, setProblem] = useState<string | null>(null);

  // The log in modal opens over the page.
  function askToSignIn() {
    router.push("/login");
  }

  function change(room: Room, action: Change["action"]) {
    if (!signedIn) {
      askToSignIn();
      return;
    }
    // One save per room at a time: a second press, or the leave sheet's
    // button pressed twice while it closes, is ignored.
    if (saving.includes(room.id)) return;
    setProblem(null);
    startTransition(async () => {
      markSaving(room.id);
      // A private room is going to be refused, so don't show it as joined.
      if (action === "leave" || !room.isPrivate) showChange({ room, action });
      try {
        const result = await changeRoomMembership({ roomId: room.id, action });
        if (!result.ok) setProblem(result.error);
      } catch {
        setProblem("บันทึกไม่สำเร็จ ลองใหม่อีกครั้งนะ");
      }
    });
  }

  const value: RoomMembershipValue = {
    rooms,
    membership,
    joinedRooms: listJoinedRooms(myRooms, rooms, membership),
    isJoined: (roomId) => membershipStatus(membership, roomId) === "joined",
    isSaving: (roomId) => saving.includes(roomId),
    join: (room) => change(room, "join"),
    askToLeave: setLeaving,
    signedIn,
    askToSignIn,
  };

  return (
    <RoomMembershipContext value={value}>
      {children}
      {leaving && (
        <LeaveRoomModal
          room={leaving}
          onClose={() => setLeaving(null)}
          onLeave={() => change(leaving, "leave")}
        />
      )}
      {problem && (
        <p
          role="alert"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex w-fit max-w-md items-center gap-2 rounded-lg border-[1.5px] border-ink bg-white py-2 pl-4 pr-2 text-sm shadow-sticker-lg"
        >
          {problem}
          <button
            type="button"
            aria-label="ปิด"
            onClick={() => setProblem(null)}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-butter hover:text-ink"
          >
            <Icon name="x" className="size-4" />
          </button>
        </p>
      )}
    </RoomMembershipContext>
  );
}
