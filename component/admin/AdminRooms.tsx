
"use client";

import { useMemo, useState } from "react";
import { archiveRoom, updateRoom } from "@/app/admin/rooms/actions";

type Room = {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  status: "active" | "suspended" | "archived";
  createdAt: string;
  members: number;
  posts: number;
};

type Props = {
  rooms: Room[];
  summary: {
    total: number;
    public: number;
    private: number;
    archived: number;
  };
};

type Tab = "all" | "public" | "private" | "archived";

const tabs: { id: Tab; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "public", label: "สาธารณะ" },
  { id: "private", label: "ส่วนตัว" },
  { id: "archived", label: "จัดเก็บแล้ว" },
];

function formatDate(date: string) {
  const now = new Date();
  const created = new Date(date);
  const days = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days < 1) return "วันนี้";
  if (days < 30) return `${days} วันที่แล้ว`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} เดือนที่แล้ว`;

  const years = Math.floor(months / 12);
  return `${years} ปีที่แล้ว`;
}

function formatNumber(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return value.toLocaleString("en-US");
}

export default function AdminRooms({ rooms, summary }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Room | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Room | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesTab =
        tab === "all" ||
        (tab === "public" && room.type === "public") ||
        (tab === "private" && room.type === "private") ||
        (tab === "archived" && room.status === "archived");

      const matchesSearch = room.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [rooms, tab, search]);

  const allSelected =
    filteredRooms.length > 0 &&
    filteredRooms.every((room) => selected.includes(room.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((current) =>
        current.filter((id) => !filteredRooms.some((room) => room.id === id))
      );
    } else {
      setSelected((current) => [
        ...new Set([...current, ...filteredRooms.map((room) => room.id)]),
      ]);
    }
  }

  function toggleOne(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function handleSave() {
    if (!editing) return;

    setPending(true);
    setNotice("");

    const result = await updateRoom(editing.id, {
      name: editing.name,
      description: editing.description,
    });

    setPending(false);

    if (!result.ok) {
      setNotice(result.error);
      return;
    }

    setEditing(null);
    setNotice("บันทึกการแก้ไขเรียบร้อยแล้ว");
  }

  async function handleArchive() {
    if (!confirmArchive) return;

    setPending(true);
    setNotice("");

    const result = await archiveRoom(confirmArchive.id);

    setPending(false);

    if (!result.ok) {
      setNotice(result.error);
      return;
    }

    setSelected((current) =>
      current.filter((id) => id !== confirmArchive.id)
    );
    setConfirmArchive(null);
    setNotice("จัดเก็บห้องเรียบร้อยแล้ว");
  }

  async function handleBulkArchive() {
    const targets = rooms.filter(
      (room) =>
        selected.includes(room.id) && room.status !== "archived"
    );

    if (!targets.length) return;

    const confirmed = window.confirm(
      `ต้องการจัดเก็บ ${targets.length} ห้องที่เลือกหรือไม่?`
    );

    if (!confirmed) return;

    setPending(true);
    setNotice("");

    for (const room of targets) {
      const result = await archiveRoom(room.id);

      if (!result.ok) {
        setNotice(result.error);
        setPending(false);
        return;
      }
    }

    setSelected([]);
    setPending(false);
    setNotice(`จัดเก็บ ${targets.length} ห้องเรียบร้อยแล้ว`);
  }

  return (
    <div className="min-h-full text-ink">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-[28px]">ห้องแชท</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {summary.total.toLocaleString("en-US")} ห้อง ·{" "}
            {summary.private.toLocaleString("en-US")} ห้องส่วนตัว
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาห้อง..."
            className="h-10 w-full rounded-lg border border-edge-strong bg-white pl-10 pr-3 text-sm outline-none focus:border-kmutt-orange focus:ring-3 focus:ring-kmutt-yellow/40"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-6 border-b border-edge">
        {tabs.map((item) => {
          const count =
            item.id === "all"
              ? summary.total
              : item.id === "public"
                ? summary.public
                : item.id === "private"
                  ? summary.private
                  : summary.archived;

          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setSelected([]);
              }}
              className={`-mb-px border-b-2 pb-2 text-sm transition ${
                tab === item.id
                  ? "border-ink font-semibold text-ink"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {item.label} ({count.toLocaleString("en-US")})
            </button>
          );
        })}
      </div>

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border-[1.5px] border-edge-strong bg-white px-4 py-3 text-sm"
        >
          {notice}
          <button
            onClick={() => setNotice("")}
            className="ml-3 text-ink-soft underline"
          >
            ปิด
          </button>
        </div>
      )}

      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3 text-sm">
          <span>เลือกแล้ว {selected.length} ห้อง</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelected([])}
              className="rounded-md border px-3 py-1.5 hover:bg-butter"
            >
              ยกเลิกการเลือก
            </button>
            <button
              disabled={pending}
              onClick={handleBulkArchive}
              className="rounded-md border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              จัดเก็บที่เลือก
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-edge-strong bg-white">
        <table className="w-full min-w-[850px] border-collapse text-left text-sm">
          <thead className="bg-cream text-ink-soft">
            <tr className="h-10">
              <th className="w-14 px-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="เลือกห้องทั้งหมด"
                  className="h-4 w-4 accent-black"
                />
              </th>
              <th className="px-4 font-medium">ชื่อห้อง</th>
              <th className="px-4 font-medium">ประเภท</th>
              <th className="px-4 font-medium">สมาชิก</th>
              <th className="px-4 font-medium">โพสต์</th>
              <th className="px-4 font-medium">สร้างเมื่อ</th>
              <th className="px-4 font-medium">สถานะ</th>
              <th className="px-4 font-medium">การจัดการ</th>
            </tr>
          </thead>

          <tbody>
            {filteredRooms.map((room) => (
              <tr
                key={room.id}
                className="h-[55px] border-t border-edge hover:bg-cream"
              >
                <td className="px-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(room.id)}
                    onChange={() => toggleOne(room.id)}
                    aria-label={`เลือกห้อง ${room.name}`}
                    className="h-4 w-4 accent-black"
                  />
                </td>

                <td className="px-4 font-medium">{room.name}</td>

                <td className="px-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      room.type === "private"
                        ? "bg-butter text-ink"
                        : "bg-cream text-ink"
                    }`}
                  >
                    {room.type === "private" ? "ส่วนตัว" : "สาธารณะ"}
                  </span>
                </td>

                <td className="px-4 tabular-nums">
                  {formatNumber(room.members)}
                </td>

                <td className="px-4 tabular-nums">
                  {formatNumber(room.posts)}
                </td>

                <td className="px-4 text-ink-soft">
                  {formatDate(room.createdAt)}
                </td>

                <td className="px-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      room.status === "active"
                        ? "bg-green-50 text-green-700"
                        : room.status === "archived"
                          ? "bg-cream text-ink-soft"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {room.status === "active"
                      ? "ใช้งาน"
                      : room.status === "archived"
                        ? "จัดเก็บแล้ว"
                        : "ระงับ"}
                  </span>
                </td>

                <td className="px-4">
                  <div className="flex gap-2">
                    <button
                      disabled={room.status === "archived"}
                      onClick={() => setEditing(room)}
                      className="rounded-md border border-edge-strong px-2.5 py-1 text-xs hover:bg-butter disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      แก้ไข
                    </button>
                    <button
                      disabled={room.status === "archived"}
                      onClick={() => setConfirmArchive(room)}
                      className="rounded-md border border-edge-strong px-2.5 py-1 text-xs hover:bg-butter disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      จัดเก็บ
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredRooms.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <p className="font-medium text-ink-soft">
                    {rooms.length === 0
                      ? "ยังไม่มีห้องแชท"
                      : search
                        ? "ไม่พบห้องที่ค้นหา"
                        : "ไม่มีห้องในหมวดหมู่นี้"}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {rooms.length === 0
                      ? "เมื่อมีการสร้างห้อง ห้องจะแสดงที่นี่"
                      : "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">แก้ไขห้องแชท</h2>

            <label className="mt-5 block text-sm font-medium">
              ชื่อห้อง
            </label>
            <input
              value={editing.name}
              onChange={(event) =>
                setEditing({ ...editing, name: event.target.value })
              }
              maxLength={100}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-kmutt-orange"
            />

            <label className="mt-4 block text-sm font-medium">
              คำอธิบาย
            </label>
            <textarea
              value={editing.description}
              onChange={(event) =>
                setEditing({ ...editing, description: event.target.value })
              }
              rows={3}
              maxLength={500}
              className="mt-2 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-kmutt-orange"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                disabled={pending}
                onClick={() => setEditing(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                ยกเลิก
              </button>
              <button
                disabled={pending || !editing.name.trim()}
                onClick={handleSave}
                className="rounded-lg bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {pending ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">จัดเก็บห้องแชท?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              ต้องการจัดเก็บห้อง &quot;{confirmArchive.name}&quot; ใช่หรือไม่?
              ข้อมูลห้องจะยังอยู่ในระบบ แต่สถานะจะเปลี่ยนเป็นจัดเก็บแล้ว
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                disabled={pending}
                onClick={() => setConfirmArchive(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                ยกเลิก
              </button>
              <button
                disabled={pending}
                onClick={handleArchive}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {pending ? "กำลังจัดเก็บ..." : "ยืนยันจัดเก็บ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
