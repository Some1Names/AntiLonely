import Link from "next/link";
import type { MyRoom } from "@/lib/mock";

// Room icons are pastel paper squares. Private rooms are always blue grey to
// match their tag; the rest alternate.
const tileColors = ["bg-butter", "bg-peach"];

export default function Sidebar({ rooms }: { rooms: MyRoom[] }) {
  return (
    <nav aria-labelledby="my-rooms-label" className="flex flex-col gap-1">
      <p
        id="my-rooms-label"
        className="px-2 pb-1 text-xs font-semibold text-ink-soft"
      >
        ห้องของฉัน
      </p>
      <ul className="flex flex-col gap-1">
        {rooms.map((room, index) => (
          <li key={room.id}>
            <Link
              href={`/rooms/${room.id}`}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-butter/70"
            >
              <span
                className={`size-7 shrink-0 rounded-sm border border-edge ${
                  room.isPrivate ? "bg-mist" : tileColors[index % tileColors.length]
                }`}
              />
              <span className="flex-1 truncate">{room.name}</span>
              {room.unread > 0 ? (
                <span className="rounded bg-kmutt-orange-dark px-1.5 text-xs font-semibold text-white">
                  {room.unread}
                </span>
              ) : room.isPrivate ? (
                <span className="rounded bg-mist px-2 text-xs text-mist-ink">
                  ส่วนตัว
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="rounded-md px-2 py-2 text-left text-sm text-ink-soft hover:bg-butter/70"
      >
        + สร้างห้องใหม่
      </button>
      <button
        type="button"
        className="rounded-md border-[1.5px] border-edge-strong bg-white px-2 py-2 text-sm font-semibold hover:bg-butter"
      >
        สุ่มห้องเลย
      </button>
    </nav>
  );
}
