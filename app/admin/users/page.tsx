"use client";

import Link from "next/link";
import { useState } from "react";
import { useNow } from "@/component/useNow";

type Status = "active" | "suspended" | "banned";

type User = {
  id: number;
  name: string; // เช่น "anon_445"
  email: string; // เช่น "anna@gmail.com" (ตอนแสดงจะซ่อนเป็น an***@gmail.com)
  joinedAt: string; // เวลาแบบ ISO เช่น "2026-09-20T10:00:00+07:00"
  lastActiveAt: string | null; // เวลาแบบ ISO หรือ null ถ้ายังไม่เคยใช้งาน
  posts: number; // จำนวนโพสต์
  status: Status;
};

// เริ่มต้นยังไม่มีผู้ใช้ ตอนมีข้อมูลจริงให้ใส่รายการตามรูปแบบ User ด้านบน
const initialUsers: User[] = [];

const filters: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ใช้งาน" },
  { key: "suspended", label: "ระงับ" },
  { key: "banned", label: "แบน" },
];

const statusLabel: Record<Status, string> = {
  active: "ใช้งาน",
  suspended: "ระงับ",
  banned: "แบน",
};

const statusStyle: Record<Status, string> = {
  active: "bg-green-50 text-green-600",
  suspended: "bg-yellow-100 text-yellow-800",
  banned: "bg-red-50 text-red-500",
};

// ปุ่มสลับสถานะในแต่ละแถว
const toggleAction: Record<Status, { label: string; next: Status }> = {
  active: { label: "ระงับ", next: "suspended" },
  suspended: { label: "ปลดระงับ", next: "active" },
  banned: { label: "ปลดแบน", next: "active" },
};

// "anna@gmail.com" -> "an***@gmail.com"
function maskEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  return `${local.slice(0, local.length <= 2 ? 1 : 2)}***${email.slice(at)}`;
}

// "Sep 20, 2026"
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

// "2 นาทีที่แล้ว", "3 วันที่แล้ว", "1 สัปดาห์ที่แล้ว"
function timeAgo(iso: string | null, now: number) {
  if (!iso) return "ยังไม่เคยใช้งาน";
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "เมื่อสักครู่";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  if (days < 30) return `${Math.floor(days / 7)} สัปดาห์ที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const now = useNow();
  if (now === null) return null;

  const q = query.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      (filter === "all" || u.status === filter) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  );

  const registered = users.length;
  const online = users.filter(
    (u) => u.lastActiveAt && now - new Date(u.lastActiveAt).getTime() < 5 * 60 * 1000,
  ).length;

  const allSelected = visible.length > 0 && visible.every((u) => selected.has(u.id));

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(visible.map((u) => u.id)));
  }

  // เปลี่ยนสถานะผู้ใช้ — ตอนต่อฐานข้อมูลจริง ให้เรียก API ที่นี่ก่อน แล้วค่อยอัปเดต state
  function changeStatus(ids: number[], status: Status) {
    if (status === "banned" && !window.confirm(`ยืนยันการแบน ${ids.length} บัญชี?`)) return;
    setUsers((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, status } : u)));
    setSelected(new Set());
  }

  return (
    <div>
      {/* หัวหน้า + ค้นหา */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">ผู้ใช้</h1>
          <p className="mt-1 text-sm text-gray-500">
            {registered.toLocaleString("en-US")} คนลงทะเบียน · {online.toLocaleString("en-US")}{" "}
            คนออนไลน์
          </p>
        </div>

        <div className="relative w-80 max-w-full">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
              setSelected(new Set());
            }}
            placeholder="ค้นหาผู้ใช้..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-gray-400 focus:border-gray-400"
          />
        </div>
      </div>

      {/* คนออนไลน์ */}
      <div className="mt-5 flex items-center gap-2 text-[13px] text-gray-500">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        {online.toLocaleString("en-US")} คนออนไลน์
      </div>

      {/* ตัวกรองสถานะ */}
      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setSelected(new Set());
            }}
            className={`rounded-full border px-4 py-1.5 text-[13px] ${
              filter === f.key
                ? "border-neutral-900 bg-neutral-900 font-medium text-white"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* แถบดำเมื่อมีการเลือก */}
      {selected.size > 0 && (
        <div className="mt-5 flex items-center justify-between rounded-xl bg-neutral-900 px-4 py-3.5 text-white">
          <span className="text-[13px] font-semibold">เลือกแล้ว {selected.size} รายการ</span>
          <div className="flex gap-2">
            <button
              onClick={() => changeStatus(Array.from(selected), "suspended")}
              className="rounded-md bg-neutral-700 px-3.5 py-1.5 text-xs font-semibold hover:bg-neutral-600"
            >
              ระงับ
            </button>
            <button
              onClick={() => changeStatus(Array.from(selected), "banned")}
              className="rounded-md bg-red-950 px-3.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900"
            >
              แบน
            </button>
          </div>
        </div>
      )}

      {/* ตาราง */}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="border-b border-gray-200 bg-gray-100 text-gray-500">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={visible.length === 0}
                  onChange={toggleAll}
                  aria-label="เลือกทั้งหมด"
                  className="h-4 w-4 accent-neutral-900"
                />
              </th>
              <th className="px-2 py-3 font-medium">ผู้ใช้</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">เข้าร่วม</th>
              <th className="px-4 py-3 font-medium">ใช้งานล่าสุด</th>
              <th className="px-4 py-3 font-medium">โพสต์</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr
                key={u.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    onChange={() => toggleOne(u.id)}
                    aria-label={`เลือก ${u.name}`}
                    className="h-4 w-4 accent-neutral-900"
                  />
                </td>
                <td className="px-2 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-gray-200" />
                    <span>{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4">{maskEmail(u.email)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-500">
                  {formatDate(u.joinedAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-500">
                  {timeAgo(u.lastActiveAt, now)}
                </td>
                <td className="px-4 py-4">{u.posts.toLocaleString("en-US")}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle[u.status]}`}
                  >
                    {statusLabel[u.status]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-1.5">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium hover:bg-gray-50"
                    >
                      ดู
                    </Link>
                    <button
                      onClick={() => changeStatus([u.id], toggleAction[u.status].next)}
                      className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium hover:bg-gray-50"
                    >
                      {toggleAction[u.status].label}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="py-14 text-center text-sm text-gray-400">
                  {users.length === 0 ? "ยังไม่มีผู้ใช้" : "ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}