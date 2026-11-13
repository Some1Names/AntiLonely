"use client";

import { useState } from "react";
import { useNow } from "@/component/useNow";

type Log = {
  id: number;
  createdAt: string; // เวลาแบบ ISO เช่น "2026-09-26T14:32:00+07:00"
  admin: string; // เช่น "admin_01"
  action: string; // เช่น "ลบข้อความ" หรือ "ระงับผู้ใช้ · เหลือ 5 วัน"
  target: string; // เช่น "anon_203", "Post #4521"
  detail: string; // เช่น "คุกคามซ้ำ"
  ip: string; // เช่น "192.168.1.45" (ตอนแสดงจะซ่อนเลขท้ายเป็น x)
};

// เริ่มต้นยังไม่มีบันทึก ตอนมีข้อมูลจริงให้ใส่รายการตามรูปแบบ Log ด้านบน
const logs: Log[] = [];

const PAGE_SIZE = 50;

const ranges = [
  { value: "1", label: "24 ชั่วโมงล่าสุด" },
  { value: "7", label: "7 วันล่าสุด" },
  { value: "30", label: "30 วันล่าสุด" },
];

// การกระทำที่ต้องการให้ป้ายเป็นสีเหลือง / แดง (นอกนั้นสีเทา)
const warnActions = ["ระงับผู้ใช้"];
const dangerActions = ["ลบข้อความ", "แบนผู้ใช้"];

// "ระงับผู้ใช้ · เหลือ 5 วัน" -> "ระงับผู้ใช้"
const baseAction = (action: string) => action.split(" · ")[0];

// "Sep 26, 2026 14:32"
function formatTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  });
  return `${date} ${time}`;
}

// "192.168.1.45" -> "192.168.1.x"
const maskIp = (ip: string) => ip.replace(/\.\d+$/, ".x");

function tagStyle(action: string) {
  const base = baseAction(action);
  if (warnActions.includes(base)) return "bg-butter text-ink";
  if (dangerActions.includes(base)) return "bg-red-50 text-red-600";
  return "bg-butter text-ink";
}

// เลขหน้าที่จะแสดง เช่น [1, 2, 3, "…", 37]
function pageItems(page: number, totalPages: number): (number | "…")[] {
  const set = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  if (page <= 2) {
    set.add(2);
    set.add(3);
  }
  if (page >= totalPages - 1) {
    set.add(totalPages - 1);
    set.add(totalPages - 2);
  }
  const nums = Array.from(set)
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | "…")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (prev && n - prev > 1) items.push("…");
    items.push(n);
    prev = n;
  }
  return items;
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-lg border-[1.5px] border-edge-strong bg-white pl-3.5 pr-9 text-[13px] outline-none hover:border-gray-300 focus:border-kmutt-orange"
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function AdminLogsPage() {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("7");
  const [action, setAction] = useState("all");
  const [admin, setAdmin] = useState("all");
  const [page, setPage] = useState(1);
  const now = useNow();
  if (now === null) return null;

  // ตัวเลือกใน dropdown สร้างจากข้อมูลจริง
  const actionOptions = Array.from(new Set(logs.map((l) => baseAction(l.action))));
  const adminOptions = Array.from(new Set(logs.map((l) => l.admin)));

  const since = now - Number(range) * 24 * 60 * 60 * 1000;
  const q = query.trim().toLowerCase();

  const filtered = logs
    .filter((l) => {
      if (new Date(l.createdAt).getTime() < since) return false;
      if (action !== "all" && baseAction(l.action) !== action) return false;
      if (admin !== "all" && l.admin !== admin) return false;
      if (q && ![l.admin, l.action, l.target, l.detail, l.ip].some((v) => v.toLowerCase().includes(q)))
        return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div>
      {/* หัวหน้า + ค้นหา */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-[28px]">บันทึกกิจกรรม</h1>
          <p className="mt-1 text-sm text-ink-soft">บันทึกกิจกรรมของระบบและผู้ดูแล</p>
        </div>

        <div className="relative w-full sm:w-80">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/70"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาบันทึก..."
            className="h-10 w-full rounded-lg border-[1.5px] border-edge-strong bg-white pl-10 pr-4 text-sm outline-none placeholder:text-ink-soft/70 focus:border-kmutt-orange"
          />
        </div>
      </div>

      {/* ตัวกรอง */}
      <div className="mt-6 flex flex-wrap gap-3">
        <FilterSelect
          value={range}
          onChange={(v) => {
            setRange(v);
            setPage(1);
          }}
        >
          {ranges.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={action}
          onChange={(v) => {
            setAction(v);
            setPage(1);
          }}
        >
          <option value="all">ทุกการกระทำ</option>
          {actionOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={admin}
          onChange={(v) => {
            setAdmin(v);
            setPage(1);
          }}
        >
          <option value="all">ผู้ดูแลทุกคน</option>
          {adminOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </FilterSelect>
      </div>

      {/* ตาราง */}
      <div className="mt-5 overflow-x-auto rounded-xl border-[1.5px] border-ink bg-white shadow-[4px_4px_0_var(--color-edge-strong)]">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="border-b border-edge-strong bg-butter text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">เวลา</th>
              <th className="px-4 py-3 font-medium">ผู้ดูแล</th>
              <th className="px-4 py-3 font-medium">การกระทำ</th>
              <th className="px-4 py-3 font-medium">เป้าหมาย</th>
              <th className="px-4 py-3 font-medium">รายละเอียด</th>
              <th className="px-4 py-3 font-medium">ที่อยู่ IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr
                key={l.id}
                className="border-b border-edge-strong last:border-b-0 hover:bg-butter"
              >
                <td className="whitespace-nowrap px-4 py-4">{formatTime(l.createdAt)}</td>
                <td className="px-4 py-4 font-semibold">{l.admin}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${tagStyle(l.action)}`}
                  >
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-4">{l.target}</td>
                <td className="px-4 py-4 text-ink-soft">{l.detail}</td>
                <td className="px-4 py-4 text-ink-soft/70">{maskIp(l.ip)}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-14 text-center text-sm text-ink-soft/70">
                  {logs.length === 0 ? "ยังไม่มีบันทึกกิจกรรม" : "ไม่พบบันทึกที่ตรงกับเงื่อนไข"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ท้ายตาราง: จำนวน + เลขหน้า */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-[13px]">
        <p className="text-ink-soft">
          {filtered.length === 0
            ? "ไม่มีรายการ"
            : `แสดง ${start + 1}-${start + rows.length} จาก ${filtered.length.toLocaleString("en-US")} รายการ`}
        </p>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md border border-edge-strong bg-white px-3 py-1.5 text-ink-soft hover:bg-butter disabled:opacity-50"
            >
              ก่อนหน้า
            </button>

            {pageItems(currentPage, totalPages).map((item, i) =>
              item === "…" ? (
                <span key={`gap-${i}`} className="px-1 text-ink-soft/70">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`min-w-[32px] rounded-md border px-2.5 py-1.5 ${
                    item === currentPage
                      ? "border-ink bg-ink font-medium text-white"
                      : "border-edge-strong bg-white hover:bg-butter"
                  }`}
                >
                  {item}
                </button>
              ),
            )}

            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-md border border-edge-strong bg-white px-3 py-1.5 hover:bg-butter disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>
    </div>
  );
}