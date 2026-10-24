import Link from "next/link";
import JoinButton from "@/component/JoinButton";
import { formatCount } from "@/lib/format";
import type { Room } from "@/lib/mock";

export default function RoomCard({
  room,
  isMember,
}: {
  room: Room;
  isMember: boolean;
}) {
  return (
    <article className="relative flex h-full flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">
          {/* The ::after stretches over the whole card so the card opens the
              room; the join button sits above it and stays separate. */}
          <Link
            href={`/rooms/${room.id}`}
            className="after:absolute after:inset-0 after:rounded-xl"
          >
            {room.name}
          </Link>
        </h3>
        {room.isPrivate && (
          <span className="rounded-full border border-zinc-300 px-2 text-xs text-zinc-500">
            ส่วนตัว
          </span>
        )}
      </div>
      <p className="truncate text-sm text-zinc-600">{room.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <p className="text-xs text-zinc-500">
          สมาชิก {formatCount(room.members)} · วันนี้ {room.postsToday} กระทู้
        </p>
        <div className="relative z-10 shrink-0">
          <JoinButton isPrivate={room.isPrivate} isMember={isMember} />
        </div>
      </div>
    </article>
  );
}
