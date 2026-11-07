import Link from "next/link";
import Icon from "@/component/Icon";
import JoinButton from "@/component/JoinButton";
import Tape from "@/component/Tape";
import { formatCount } from "@/lib/format";
import { defaultRoomEmoji, type Room } from "@/lib/mock";

// Each kind of room has a color for the card's shadow, its tape and its icon
// tile: blue grey for private rooms (matching their tag), peach for new ones,
// yellow for the rest. The tape sits in a different spot for each kind too.
function look(room: Room) {
  if (room.isPrivate)
    return {
      card: "[--tone:var(--color-kmutt-grey)]",
      tile: "border-edge-strong bg-mist",
      tape: "left-1/2 -translate-x-1/2 rotate-2 bg-kmutt-grey/45",
    };
  if (room.isNew)
    return {
      card: "[--tone:var(--color-peach-edge)]",
      tile: "border-peach-edge bg-peach",
      tape: "right-6 rotate-6 bg-peach-edge/80",
    };
  return {
    card: "[--tone:var(--color-kmutt-yellow)]",
    tile: "border-butter-edge bg-butter",
    tape: "left-6 -rotate-6 bg-kmutt-yellow/70",
  };
}

// An index card taped into the notebook, with an ink outline and a colored
// shadow. It lifts and tilts a little on hover.
export default function RoomCard({
  room,
  isMember,
}: {
  room: Room;
  isMember: boolean;
}) {
  const { card, tile, tape } = look(room);

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
          {room.emoji ?? defaultRoomEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold leading-snug">
              {/* The ::after stretches over the whole card so the card opens the
                  room; the join button sits above it and stays separate. The
                  card draws the focus ring for it. */}
              <Link
                href={`/rooms/${room.id}`}
                className="outline-none after:absolute after:inset-0 after:rounded-xl"
              >
                {room.name}
              </Link>
            </h3>
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
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">
            {room.description}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t-[1.5px] border-dashed border-edge pt-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
          <span className="flex items-center gap-1">
            <Icon name="users" className="size-3.5" />
            สมาชิก {formatCount(room.members)}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="message" className="size-3.5" />
            วันนี้ {room.postsToday} กระทู้
          </span>
        </p>
        <div className="relative z-10 shrink-0">
          <JoinButton isPrivate={room.isPrivate} isMember={isMember} />
        </div>
      </div>
    </article>
  );
}
