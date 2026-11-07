import Link from "next/link";
export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/boardfeed" className="text-xl font-bold">
          AntiLonely
        </Link>
        <div className="flex items-center gap-4">
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
            + สร้าง
          </button>
          <div className="flex items-center gap-2 text-sm">
            โนติ
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
              3
            </span>
          </div>
          <Link href="/profile">
            <div className="h-9 w-9 rounded-full bg-gray-300" />
          </Link>
        </div>
      </div>
    </header>
  );
}