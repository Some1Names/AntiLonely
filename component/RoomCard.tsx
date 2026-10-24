import Link from "next/link";
import JoinButton from "@/component/JoinButton";
import { formatCount } from "@/lib/format";
import type { Room } from "@/lib/mock";

// Index card with a colored strip along the top: blue grey for private rooms
// (matching their tag), peach for new ones, yellow for the rest.
function stripeColor(room: Room) {
  if (room.isPrivate) return "before:bg-kmutt-grey";
  if (room.isNew) return "before:bg-peach-edge";
  return "before:bg-kmutt-yellow";
}

export default function RoomCard({
  room,
  isMember,
}: {
  room: Room;
  isMember: boolean;
}) {
  return (
    <article
      className={`relative flex h-full flex-col gap-2 rounded-xs border border-edge bg-white p-4 pt-5 transition-transform before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:rounded-t-xs hover:-rotate-[0.6deg] hover:shadow-paper motion-reduce:transition-none motion-reduce:hover:rotate-0 ${stripeColor(room)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-semibold">
          {/* The ::after stretches over the whole card so the card opens the
              room; the join button sits above it and stays separate. */}
          <Link
            href={`/rooms/${room.id}`}
            className="after:absolute after:inset-0 after:rounded-xs"
          >
            {room.name}
          </Link>
        </h3>
        {room.isPrivate && (
          <span className="rounded bg-mist px-2 text-xs text-mist-ink">
            ส่วนตัว
          </span>
        )}
      </div>
      <p className="truncate text-sm text-ink-soft">{room.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t-[1.5px] border-dashed border-edge pt-3">
        <p className="text-xs text-ink-soft">
          สมาชิก {formatCount(room.members)} · วันนี้ {room.postsToday} กระทู้
        </p>
        <div className="relative z-10 shrink-0">
          <JoinButton isPrivate={room.isPrivate} isMember={isMember} />
        </div>
      </div>
    </article>
  );
}
