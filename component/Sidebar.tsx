import Link from "next/link";
import type { MyRoom } from "@/lib/mock";

export default function Sidebar({ rooms }: { rooms: MyRoom[] }) {
  return (
    <nav aria-labelledby="my-rooms-label" className="flex flex-col gap-1">
      <p id="my-rooms-label" className="px-2 pb-1 text-xs text-zinc-500">
        ห้องของฉัน
      </p>
      <ul className="flex flex-col gap-1">
        {rooms.map((room) => (
          <li key={room.id}>
            <Link
              href={`/rooms/${room.id}`}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-100"
            >
              <span className="size-7 shrink-0 rounded bg-zinc-300" />
              <span className="flex-1 truncate">{room.name}</span>
              {room.unread > 0 ? (
                <span className="rounded-full bg-zinc-800 px-2 text-xs text-white">
                  {room.unread}
                </span>
              ) : room.isPrivate ? (
                <span className="rounded-full border border-zinc-300 px-2 text-xs text-zinc-500">
                  ส่วนตัว
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="rounded-md px-2 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100"
      >
        + สร้างห้องใหม่
      </button>
      <button
        type="button"
        className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm hover:bg-zinc-100"
      >
        สุ่มห้องเลย
      </button>
    </nav>
  );
}
