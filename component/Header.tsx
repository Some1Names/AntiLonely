import Link from "next/link";
import { primaryButtonClass } from "@/lib/styles";

export default function Header({ notifications }: { notifications: number }) {
  return (
    <header className="border-b-[1.5px] border-edge bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-semibold">
          Anti<span className="text-kmutt-orange">Lonely</span>
        </Link>
        <div className="flex items-center gap-4">
          <button type="button" className={`px-3 py-2 ${primaryButtonClass}`}>
            + สร้าง
          </button>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md bg-butter px-3 text-sm hover:bg-highlight"
          >
            โนติ
            <span className="rounded bg-kmutt-orange-dark px-1.5 text-xs font-semibold text-white">
              {notifications}
            </span>
          </button>
          {/* No logged-out state in the wireframes yet, so the avatar opens log in. */}
          <Link
            href="/login"
            aria-label="เข้าสู่ระบบ"
            className="size-9 rounded-full border-2 border-kmutt-yellow bg-peach"
          />
        </div>
      </div>
    </header>
  );
}
