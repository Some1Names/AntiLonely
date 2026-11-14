import Link from "next/link";
import Icon from "@/component/Icon";
import JoinButton from "@/component/JoinButton";
import LinkPending from "@/component/LinkPending";
import Tape from "@/component/Tape";
import { formatCount } from "@/lib/format";
import { DEFAULT_ROOM_EMOJI } from "@/lib/room-board";
import type { Room } from "@/types/room";
import { resolveRoomPostCountStats } from "@/lib/room-board";
import { roomLook } from "@/lib/styles";

// An index card taped into the notebook, with an ink outline and a shadow in
// the room's color (roomLook). It lifts and tilts a little on hover.
export default function RoomCard({ room }: { room: Room }) {
  const { card, tile, tape } = roomLook(room);

  return (
    <article
      className={`group relative flex h-full flex-col gap-3 rounded-xl border-[1.5px] border-ink bg-white p-4 pt-5 shadow-[4px_4px_0_var(--tone)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-kmutt-orange-dark hover:-translate-0.5 hover:-rotate-[0.6deg] hover:shadow-[6px_6px_0_var(--tone)] motion-safe:transition-[translate,rotate,box-shadow] motion-safe:duration-200 motion-reduce:hover:translate-0 motion-reduce:hover:rotate-0 ${card}`}
    >
      <Tape className={`h-5 w-14 ${tape}`} />
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg border-[1.5px] text-xl group-hover:-rotate-6 motion-safe:transition-transform ${tile}`}
        >
          {room.emoji ?? DEFAULT_ROOM_EMOJI}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold leading-snug">
              {/* The ::after stretches over the whole card so the card opens the
                  room; the join button sits above it and stays separate. The
                  card draws the focus ring for it. */}
              <Link
                href={`/rooms/${room.slug ?? room.id}`}
                className="outline-none after:absolute after:inset-0 after:rounded-xl"
              >
                {room.name}
                {/* On the card's corner while the room page loads. */}
                <LinkPending className="-right-2.5 -top-2.5" />
              </Link>
            </h3>
            <RoomTags room={room} />
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">
            {room.description}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t-[1.5px] border-dashed border-edge pt-3">
        <RoomStats room={room} />
        <div className="relative z-10 shrink-0">
          <JoinButton room={room} />
        </div>
      </div>
    </article>
  );
}

// The "ใหม่" and "ส่วนตัว" tags. The random-room sheet shows them too.
export function RoomTags({ room }: { room: Room }) {
  return (
    <div className="flex shrink-0 gap-1">
      {room.isNew && (
        <span className="rounded-full bg-peach px-2 text-xs font-semibold leading-5 text-kmutt-orange-dark">
          ใหม่
        </span>
      )}
      {room.isPrivate && (
        <span className="flex items-center gap-1 rounded-full bg-mist px-2 text-xs leading-5 text-mist-ink">
          <Icon name="lock" className="size-3" />
          ส่วนตัว
        </span>
      )}
    </div>
  );
}

// Members and today's (or total) posts, with icons.
export function RoomStats({ room }: { room: Room }) {
  const postStats = resolveRoomPostCountStats(room);
  const postsLabel =
    postStats.totalPosts !== null && postStats.postsToday !== null
      ? `ทั้งหมด ${formatCount(postStats.totalPosts)} · วันนี้ ${formatCount(postStats.postsToday)} กระทู้`
      : postStats.totalPosts !== null
        ? `ทั้งหมด ${formatCount(postStats.totalPosts)} กระทู้`
        : `วันนี้ ${formatCount(postStats.postsToday ?? 0)} กระทู้`;

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
      <span className="flex items-center gap-1">
        <Icon name="users" className="size-3.5" />
        สมาชิก {formatCount(room.members)}
      </span>
      <span className="flex items-center gap-1">
        <Icon name="message" className="size-3.5" />
        {postsLabel}
      </span>
    </p>
  );
}
