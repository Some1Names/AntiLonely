"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNow } from "@/component/useNow";
import { updateUsersStatus, updateUserRole } from "./actions";

type Status = "active" | "suspended" | "banned";
type Role = "user" | "moderator" | "admin";

const roleLabel: Record<Role, string> = {
  user: "ผู้ใช้",
  moderator: "Moderator",
  admin: "Admin",
};

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  lastActiveAt: string | null;
  posts: number;
  status: Status;
};

type Props = {
  initialUsers: User[];
};

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
  suspended: "bg-butter text-ink",
  banned: "bg-red-50 text-red-500",
};

const toggleAction: Record<Status, { label: string; next: Status }> = {
  active: { label: "ระงับ", next: "suspended" },
  suspended: { label: "ปลดระงับ", next: "active" },
  banned: { label: "ปลดแบน", next: "active" },
};

function maskEmail(email: string) {
  const at = email.lastIndexOf("@");

  if (at <= 0) return "***";

  const local = email.slice(0, at);

  return `${local.slice(0, local.length <= 2 ? 1 : 2)}***${email.slice(at)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

function timeAgo(iso: string | null, now: number) {
  if (!iso) return "ยังไม่มีข้อมูล";

  const seconds = Math.max(
    0,
    Math.floor((now - new Date(iso).getTime()) / 1000),
  );

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

export default function AdminUsersClient({ initialUsers }: Props) {
  const router = useRouter();

  const [filter, setFilter] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const now = useNow();

  if (now === null) return null;

  const users = initialUsers;

  const q = query.trim().toLowerCase();

  const visible = users.filter(
    (u) =>
      (filter === "all" || u.status === filter) &&
      (!q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)),
  );

  const registered = users.length;

  // ยังไม่มี lastActiveAt ใน Database จึงไม่สามารถคำนวณคนออนไลน์จริงได้
  const allSelected =
    visible.length > 0 && visible.every((u) => selected.has(u.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleAll() {
    setSelected(
      allSelected
        ? new Set()
        : new Set(visible.map((u) => u.id)),
    );
  }

  // เรียก Server Action เพื่อเปลี่ยนสถานะใน Database
  function changeStatus(ids: string[], status: Status) {
    if (ids.length === 0 || isPending) return;

    if (
      status === "banned" &&
      !window.confirm(`ยืนยันการแบน ${ids.length} บัญชี?`)
    ) {
      return;
    }

    if (
      status === "suspended" &&
      !window.confirm(`ยืนยันการระงับ ${ids.length} บัญชี?`)
    ) {
      return;
    }

    setError("");

    startTransition(async () => {
      try {
        await updateUsersStatus(ids, status);

        setSelected(new Set());

        // โหลดข้อมูลผู้ใช้ใหม่จาก Database
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ",
        );
      }
    });
  }

  function changeRole(user: User, role: Role) {
    if (role === user.role || isPending) return;

    if (
      !window.confirm(
        `เปลี่ยน role ของ ${user.name} เป็น ${roleLabel[role]}?`,
      )
    ) {
      return;
    }

    setError("");

    startTransition(async () => {
      try {
        await updateUserRole(user.id, role);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการเปลี่ยน role",
        );
      }
    });
  }

  return (
    <div>
      {/* หัวหน้า + ค้นหา */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight">
            ผู้ใช้
          </h1>

          <p className="mt-1 text-sm text-ink-soft">
            {registered.toLocaleString("en-US")} คนลงทะเบียน
            {" · "}ข้อมูลออนไลน์ยังไม่มี
          </p>
        </div>

        <div className="relative w-80 max-w-full">
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
              setSelected(new Set());
            }}
            placeholder="ค้นหาผู้ใช้..."
            className="h-10 w-full rounded-lg border-[1.5px] border-edge-strong bg-white pl-10 pr-4 text-sm outline-none placeholder:text-ink-soft/70 focus:border-kmutt-orange"
          />
        </div>
      </div>

      {/* ข้อมูลออนไลน์ */}
      <div className="mt-5 flex items-center gap-2 text-[13px] text-ink-soft">
        <span className="h-2 w-2 rounded-full bg-gray-400" />
        ยังไม่มีข้อมูลเวลาใช้งานล่าสุด
      </div>

      {/* แสดงข้อผิดพลาด */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ตัวกรองสถานะ */}
      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            disabled={isPending}
            onClick={() => {
              setFilter(f.key);
              setSelected(new Set());
            }}
            className={`rounded-full border px-4 py-1.5 text-[13px] ${
              filter === f.key
                ? "border-ink bg-ink font-medium text-white"
                : "border-edge-strong bg-white hover:bg-butter"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* แถบดำเมื่อมีการเลือก */}
      {selected.size > 0 && (
        <div className="mt-5 flex items-center justify-between rounded-xl bg-ink px-4 py-3.5 text-white">
          <span className="text-[13px] font-semibold">
            เลือกแล้ว {selected.size} รายการ
          </span>

          <div className="flex gap-2">
            <button
              disabled={isPending}
              onClick={() =>
                changeStatus(Array.from(selected), "suspended")
              }
              className="rounded-md bg-ink-soft px-3.5 py-1.5 text-xs font-semibold hover:bg-ink-soft disabled:opacity-50"
            >
              ระงับ
            </button>

            <button
              disabled={isPending}
              onClick={() =>
                changeStatus(Array.from(selected), "banned")
              }
              className="rounded-md bg-red-950 px-3.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900 disabled:opacity-50"
            >
              แบน
            </button>
          </div>
        </div>
      )}

      {/* ตาราง */}
      <div className="mt-5 overflow-x-auto rounded-xl border-[1.5px] border-ink bg-white shadow-[4px_4px_0_var(--color-edge-strong)]">
        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead className="border-b border-edge-strong bg-butter text-ink-soft">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={visible.length === 0 || isPending}
                  onChange={toggleAll}
                  aria-label="เลือกทั้งหมด"
                  className="h-4 w-4 accent-kmutt-orange-dark"
                />
              </th>

              <th className="px-2 py-3 font-medium">ผู้ใช้</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">เข้าร่วม</th>
              <th className="px-4 py-3 font-medium">ใช้งานล่าสุด</th>
              <th className="px-4 py-3 font-medium">โพสต์</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">การจัดการ</th>
            </tr>
          </thead>

          <tbody>
            {visible.map((u) => (
              <tr
                key={u.id}
                className="border-b border-edge-strong last:border-b-0 hover:bg-butter"
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    disabled={isPending}
                    onChange={() => toggleOne(u.id)}
                    aria-label={`เลือก ${u.name}`}
                    className="h-4 w-4 accent-kmutt-orange-dark"
                  />
                </td>

                <td className="px-2 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-gray-200" />
                    <span>{u.name}</span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  {maskEmail(u.email)}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-ink-soft">
                  {formatDate(u.joinedAt)}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-ink-soft">
                  {timeAgo(u.lastActiveAt, now)}
                </td>

                <td className="px-4 py-4">
                  {u.posts.toLocaleString("en-US")}
                </td>

                <td className="px-4 py-4">
                  <select
                    value={u.role}
                    disabled={isPending}
                    onChange={(e) =>
                      changeRole(u, e.target.value as Role)
                    }
                    aria-label={`role ของ ${u.name}`}
                    className="rounded border border-edge-strong bg-white px-2 py-1 text-[12px] disabled:opacity-50"
                  >
                    {(Object.keys(roleLabel) as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {roleLabel[r]}
                      </option>
                    ))}
                  </select>
                </td>

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
                      className="rounded border border-edge-strong bg-white px-2 py-0.5 text-[11px] font-medium hover:bg-butter"
                    >
                      ดู
                    </Link>

                    <button
                      disabled={isPending}
                      onClick={() =>
                        changeStatus(
                          [u.id],
                          toggleAction[u.status].next,
                        )
                      }
                      className="rounded border border-edge-strong bg-white px-2 py-0.5 text-[11px] font-medium hover:bg-butter disabled:opacity-50"
                    >
                      {toggleAction[u.status].label}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="py-14 text-center text-sm text-ink-soft/70"
                >
                  {users.length === 0
                    ? "ยังไม่มีผู้ใช้"
                    : "ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isPending && (
        <p className="mt-3 text-sm text-ink-soft">
          กำลังบันทึกข้อมูล...
        </p>
      )}
    </div>
  );
}
