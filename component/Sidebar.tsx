import type { MyRoom } from "@/lib/mock";

export default function Sidebar({
  rooms,
  activeRoomId,
}: {
  rooms: MyRoom[];
  activeRoomId: string;
}) {
  return (
    <aside className="flex flex-col gap-1">
      <h2 className="px-2 pb-1 text-xs text-zinc-500">ห้องของฉัน</h2>
      <ul className="flex flex-col gap-1">
        {rooms.map((room) => (
          <li key={room.id}>
            <button
              type="button"
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm ${
                room.id === activeRoomId ? "bg-zinc-200" : "hover:bg-zinc-100"
              }`}
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
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="px-2 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100"
      >
        + สร้างห้องใหม่
      </button>
      <button
        type="button"
        className="rounded-md bg-zinc-200 px-2 py-2 text-left text-sm"
      >
        สุ่มห้องเลย
      </button>
    </aside>
  );
}
