"use client";

import { authClient } from "@/lib/auth-client";
import Icon from "@/component/Icon";
import Tape from "@/component/Tape";
import type { MyRoom } from "@/lib/mock";
import {
  fieldFrameClass,
  highlightClass,
  noteFieldClass,
  primaryButtonClass,
} from "@/lib/styles";

// A sticky note taped to the page, outlined like a sticker, with a doodle in
// the corner.
export default function PostBox({
  username,
  rooms,
}: {
  username: string;
  rooms: MyRoom[];
}) {
  // Show the signed-in user's own name; `username` is the fallback while the
  // session loads or when nobody is signed in.
  const { data: session } = authClient.useSession();
  const displayName = session?.user.name || username;

  return (
    <section className="relative -rotate-[0.4deg] rounded-lg border-[1.5px] border-ink bg-butter p-6 shadow-sticker-lg sm:p-7">
      <Tape />
      <Icon
        name="sparkle"
        className="absolute right-5 top-5 size-8 rotate-12 fill-current text-kmutt-orange"
      />
      <h1 className="pr-10 font-display text-2xl font-semibold sm:text-3xl">
        ยินดีต้อนรับน้า, <span className={highlightClass}>{displayName}</span> 👋
      </h1>
      <p className="mt-2 text-sm text-ink-soft sm:text-base">
        วันนี้เป็นยังไงบ้าง? อยากถาม อยากเล่า หรืออยากระบายก็ได้นะ
        ที่นี่ไม่มีใครรู้ว่าเป็นคุณ
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Icon
            name="pencil"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-kmutt-yellow-dark"
          />
          <input
            type="text"
            aria-label="เนื้อหากระทู้"
            placeholder="มีอะไรอยากเล่าไหม..."
            className={`py-2.5 pl-9 pr-3 ${noteFieldClass}`}
          />
        </div>
        <select
          aria-label="เลือกห้อง"
          className={`px-3 py-2.5 sm:w-auto ${fieldFrameClass}`}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        <button type="button" className={`px-5 py-2.5 ${primaryButtonClass}`}>
          ตั้งกระทู้
        </button>
      </div>
    </section>
  );
}
