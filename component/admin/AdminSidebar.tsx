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
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-7">
      <div className="px-3">
        <p className="text-lg font-bold tracking-tight">AntiLonely</p>
        <p className="mt-0.5 text-xs text-gray-500">แผงควบคุม</p>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {menu.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                active
                  ? "bg-gray-100 font-semibold text-neutral-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
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
    </aside>
  );
}