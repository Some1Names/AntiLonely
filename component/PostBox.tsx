import type { MyRoom } from "@/lib/mock";

export default function PostBox({
  username,
  rooms,
}: {
  username: string;
  rooms: MyRoom[];
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <h1 className="text-2xl font-semibold">ยินดีต้อนรับน้า, {username} 👋</h1>
      <p className="mt-2 text-sm text-zinc-600">
        วันนี้เป็นยังไงบ้าง? อยากถาม อยากเล่า หรืออยากระบายก็ได้นะ
        ที่นี่ไม่มีใครรู้ว่าเป็นคุณ
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          aria-label="เนื้อหากระทู้"
          placeholder="มีอะไรอยากเล่าไหม..."
          className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        <select
          aria-label="เลือกห้อง"
          className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white"
        >
          ตั้งกระทู้
        </button>
      </div>
    </section>
  );
}
