import Tape from "@/component/Tape";
import type { MyRoom } from "@/lib/mock";
import { highlightClass, primaryButtonClass } from "@/lib/styles";

// Styled as a sticky note taped to the page.
export default function PostBox({
  username,
  rooms,
}: {
  username: string;
  rooms: MyRoom[];
}) {
  return (
    <section className="relative -rotate-[0.4deg] rounded-xs border border-butter-edge bg-butter p-6 shadow-paper">
      <Tape />
      <h1 className="font-display text-2xl font-semibold">
        ยินดีต้อนรับน้า, <span className={highlightClass}>{username}</span> 👋
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        วันนี้เป็นยังไงบ้าง? อยากถาม อยากเล่า หรืออยากระบายก็ได้นะ
        ที่นี่ไม่มีใครรู้ว่าเป็นคุณ
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          aria-label="เนื้อหากระทู้"
          placeholder="มีอะไรอยากเล่าไหม..."
          className="min-w-0 flex-1 rounded-md border-[1.5px] border-dashed border-kmutt-yellow-dark/60 bg-white px-3 py-2 text-sm outline-none focus:border-solid focus:border-kmutt-orange focus:ring-3 focus:ring-kmutt-yellow/40"
        />
        <select
          aria-label="เลือกห้อง"
          className="rounded-md border border-edge-strong bg-white px-3 py-2 text-sm"
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        <button type="button" className={`px-4 py-2 ${primaryButtonClass}`}>
          ตั้งกระทู้
        </button>
      </div>
    </section>
  );
}
