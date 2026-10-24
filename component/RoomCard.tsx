import type { Room } from "@/lib/mock";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export default function RoomCard({ room }: { room: Room }) {
  return (
    <article className="flex h-full flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{room.name}</h3>
        {room.isPrivate && (
          <span className="rounded-full border border-zinc-300 px-2 text-xs text-zinc-500">
            ส่วนตัว
          </span>
        )}
      </div>
      <p className="truncate text-sm text-zinc-600">{room.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <p className="text-xs text-zinc-500">
          สมาชิก {compact.format(room.members)} · วันนี้ {room.postsToday} กระทู้
        </p>
        <button
          type="button"
          className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          {room.isPrivate ? "ขอเข้าร่วม" : "เข้าร่วม"}
        </button>
      </div>
    </article>
  );
}
