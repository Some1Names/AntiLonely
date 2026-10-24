import Link from "next/link";

export default function Header({ notifications }: { notifications: number }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold">
          AntiLonely
        </Link>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
          >
            + สร้าง
          </button>
          <button type="button" className="flex items-center gap-2 text-sm">
            โนติ
            <span className="rounded-full bg-zinc-800 px-2 text-xs text-white">
              {notifications}
            </span>
          </button>
          {/* No logged-out state in the wireframes yet, so the avatar opens log in. */}
          <Link
            href="/login"
            aria-label="เข้าสู่ระบบ"
            className="size-9 rounded-full bg-zinc-300"
          />
        </div>
      </div>
    </header>
  );
}
