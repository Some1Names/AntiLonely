"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// จำนวนรายงานที่รอตรวจ ใส่เลขจริงตอนมีข้อมูล (0 = ไม่แสดงป้ายแดง)
const reportCount = 0;

const menu = [
  { href: "/admin", label: "แดชบอร์ด" },
  { href: "/admin/reports", label: "รายงาน" },
  { href: "/admin/rooms", label: "ห้องแชท" },
  { href: "/admin/users", label: "ผู้ใช้" },
  { href: "/admin/logs", label: "บันทึกกิจกรรม" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r-[1.5px] border-dashed border-edge-strong bg-paper px-4 py-7">
      <div className="px-3">
        <p className="font-display text-lg font-bold tracking-tight">
          <span className="box-decoration-clone bg-[linear-gradient(transparent_55%,var(--color-highlight)_55%)] px-1">
            AntiLonely
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-soft">แผงควบคุม</p>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {menu.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg border-[1.5px] px-3 py-2.5 text-sm ${
                active
                  ? "border-ink bg-kmutt-yellow font-semibold text-ink shadow-sticker"
                  : "border-transparent text-ink-soft hover:bg-butter hover:text-ink"
              }`}
            >
              {item.label}
              {item.href === "/admin/reports" && reportCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {reportCount > 99 ? "99+" : reportCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="mt-auto flex items-center gap-2 rounded-lg border-[1.5px] border-ink bg-white px-3 py-2.5 text-sm font-semibold text-ink shadow-sticker hover:bg-butter active:translate-0.5 active:shadow-none"
      >
        <span aria-hidden="true">←</span>
        กลับไปหน้าหลัก
      </Link>
    </aside>
  );
}