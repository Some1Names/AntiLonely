
"use client";

import { useMemo, useState } from "react";
import {
  dismissReports,
  deleteReportedMessages,
} from "@/app/admin/reports/actions";

type ReportRow = {
  messageId: string;
  content: string;
  room: string;
  author: string;
  reason: string;
  count: number;
  status: string;
  createdAt: string;
};

type AdminReportsProps = {
  reports: ReportRow[];
};

type StatusFilter = "pending" | "resolved" | "dismissed";

const REASONS = [
  { value: "harassment", label: "คุกคาม", color: "bg-red-50 text-red-600" },
  { value: "spam", label: "สแปม", color: "bg-yellow-50 text-yellow-700" },
  { value: "image", label: "ภาพไม่เหมาะสม", color: "bg-red-50 text-red-600" },
  { value: "bully", label: "กลั่นแกล้ง", color: "bg-red-50 text-red-600" },
  { value: "other", label: "อื่นๆ", color: "bg-butter text-ink-soft" },
];

function getReasonLabel(reason: string) {
  return REASONS.find((item) => item.value === reason)?.label ?? reason;
}

function getReasonColor(reason: string) {
  return (
    REASONS.find((item) => item.value === reason)?.color ??
    "bg-butter text-ink-soft"
  );
}

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const diff = Math.max(0, Date.now() - date.getTime());

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function AdminReports({ reports }: AdminReportsProps) {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [reason, setReason] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<ReportRow | null>(null);

  // จำนวนรายงานแยกตามสถานะ
  const statusCounts = useMemo(() => {
    return {
      pending: reports.filter((item) => item.status === "pending").length,
      resolved: reports.filter((item) => item.status === "resolved").length,
      dismissed: reports.filter((item) => item.status === "dismissed").length,
    };
  }, [reports]);

  // จำนวนรายงานแยกตามเหตุผล (นับจำนวนผู้รายงาน)
  const reasonCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const item of reports) {
      if (item.status === status) {
        counts[item.reason] = (counts[item.reason] ?? 0) + item.count;
      }
    }

    return counts;
  }, [reports, status]);

  // ค้นหาและกรองข้อมูล
  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reports.filter((item) => {
      const matchStatus = item.status === status;

      const matchReason =
        reason === "all" || item.reason === reason;

      const matchSearch =
        !keyword ||
        item.content.toLowerCase().includes(keyword) ||
        item.author.toLowerCase().includes(keyword) ||
        item.room.toLowerCase().includes(keyword);

      return matchStatus && matchReason && matchSearch;
    });
  }, [reports, status, reason, search]);

  const selectedVisibleIds = filteredReports
    .filter((item) => selected.includes(item.messageId))
    .map((item) => item.messageId);

  const allVisibleSelected =
    filteredReports.length > 0 &&
    selectedVisibleIds.length === filteredReports.length;

  function toggleSelect(messageId: string) {
    setSelected((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId],
    );
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected((current) =>
        current.filter((id) => !selectedVisibleIds.includes(id)),
      );
    } else {
      setSelected((current) =>
        Array.from(new Set([...current, ...filteredReports.map((item) => item.messageId)])),
      );
    }
  }

  async function handleDismiss(ids: string[]) {
    if (ids.length === 0 || busy) return;

    const confirmed = window.confirm(
      `ต้องการยกเลิกรายงาน ${ids.length} รายการที่เลือกหรือไม่?`,
    );

    if (!confirmed) return;

    setBusy(true);
    setNotice("");

    try {
      const result = await dismissReports(ids);

      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setSelected([]);
      setNotice(`ยกเลิกรายงานสำเร็จ ${result.affected} รายการ`);
    } catch {
      setNotice("เกิดข้อผิดพลาดในการยกเลิกรายงาน");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(ids: string[]) {
    if (ids.length === 0 || busy) return;

    const confirmed = window.confirm(
      `ต้องการลบเนื้อหาของ ${ids.length} รายการที่เลือกหรือไม่?`,
    );

    if (!confirmed) return;

    setBusy(true);
    setNotice("");

    try {
      const result = await deleteReportedMessages(ids);

      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setSelected([]);
      setNotice(`จัดการเนื้อหาสำเร็จ ${result.affected} รายงาน`);
    } catch {
      setNotice("เกิดข้อผิดพลาดในการลบเนื้อหา");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: "pending", label: "รอดำเนินการ" },
    { value: "resolved", label: "แก้ไขแล้ว" },
    { value: "dismissed", label: "ยกเลิกแล้ว" },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">รายงาน</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {statusCounts.pending} รายการรอดำเนินการ · ล่าสุด{" "}
            {reports.length > 0
              ? getTimeAgo(
                  reports.reduce((latest, item) =>
                    new Date(item.createdAt) > new Date(latest.createdAt)
                      ? item
                      : latest,
                  ).createdAt,
                )
              : "-"}
          </p>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ค้นหารายงาน, ผู้ใช้, ห้อง..."
          className="w-full rounded-lg border-[1.5px] border-edge-strong bg-white px-4 py-3 text-sm outline-none focus:border-kmutt-orange md:w-80"
        />
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-6 border-b border-edge-strong">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setReason("all");
              setSelected([]);
            }}
            className={`border-b-2 pb-3 text-sm transition ${
              status === tab.value
                ? "border-ink font-semibold text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {tab.label} ({statusCounts[tab.value]})
          </button>
        ))}
      </div>

      {/* Reason filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setReason("all")}
          className={`rounded-full border px-4 py-2 text-xs ${
            reason === "all"
              ? "border-ink bg-ink text-white"
              : "border-edge-strong bg-white text-ink"
          }`}
        >
          ทุกเหตุผล
        </button>

        {REASONS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() =>
              setReason(reason === item.value ? "all" : item.value)
            }
            className={`rounded-full border px-4 py-2 text-xs ${
              reason === item.value
                ? "border-ink bg-ink text-white"
                : "border-edge-strong bg-white text-ink hover:bg-butter"
            }`}
          >
            {item.label} · {reasonCounts[item.value] ?? 0}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink px-4 py-4 text-white">
          <span className="text-sm">
            เลือกแล้ว {selected.length} รายการ
          </span>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDismiss(selected)}
              className="text-sm text-white hover:text-highlight disabled:opacity-50"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => handleDelete(selected)}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              ลบ
            </button>
          </div>
        </div>
      )}

      {/* Result notice */}
      {notice && (
        <div
          role="status"
          className="rounded-lg border border-edge-strong bg-cream px-4 py-3 text-sm text-ink"
        >
          {notice}
        </div>
      )}

      {/* Reports table */}
      <div className="overflow-x-auto rounded-xl border-[1.5px] border-ink bg-white shadow-[4px_4px_0_var(--color-edge-strong)]">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead className="bg-butter text-xs text-ink-soft">
            <tr>
              <th className="w-14 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  aria-label="เลือกทั้งหมด"
                  className="h-4 w-4 accent-kmutt-orange-dark"
                />
              </th>
              <th className="px-4 py-3">เนื้อหา</th>
              <th className="px-4 py-3">เหตุผล</th>
              <th className="px-4 py-3">รายงาน</th>
              <th className="px-4 py-3">ระยะเวลา</th>
              <th className="px-4 py-3">การจัดการ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredReports.map((item) => {
              const isPending = item.status === "pending";

              return (
                <tr key={item.messageId} className="hover:bg-butter">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.messageId)}
                      onChange={() => toggleSelect(item.messageId)}
                      aria-label={`เลือกข้อความจาก ${item.author}`}
                      className="h-4 w-4 accent-kmutt-orange-dark"
                    />
                  </td>

                  <td className="max-w-[380px] px-4 py-4">
                    <p className="truncate font-medium text-ink">
                      {item.content || "[ไม่มีเนื้อหา]"}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {item.room} · by {item.author}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${getReasonColor(item.reason)}`}
                    >
                      {getReasonLabel(item.reason)}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-semibold text-ink">
                    {item.count}
                  </td>

                  <td className="px-4 py-4 text-ink-soft">
                    {getTimeAgo(item.createdAt)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!isPending || busy}
                        onClick={() => handleDismiss([item.messageId])}
                        className="rounded-lg border border-edge-strong px-3 py-2 text-xs font-medium hover:bg-butter disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ยกเลิก
                      </button>

                      <button
                        type="button"
                        disabled={!isPending || busy}
                        onClick={() => handleDelete([item.messageId])}
                        className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ลบ
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetail(item)}
                        aria-label="ดูรายละเอียดรายงาน"
                        title="ดูรายละเอียด"
                        className="rounded-lg px-2 py-2 text-ink-soft/70 hover:bg-butter hover:text-ink"
                      >
                        •••
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredReports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <p className="font-medium text-ink">
                    {reports.length === 0
                      ? "ยังไม่มีรายงาน"
                      : "ไม่พบรายงานที่ตรงกับเงื่อนไข"}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft/70">
                    {reports.length === 0
                      ? "เมื่อมีผู้ใช้ส่งรายงาน ข้อมูลจะแสดงที่นี่"
                      : "ลองเปลี่ยนสถานะ เหตุผล หรือคำค้นหา"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail dialog */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-detail-title"
            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2
                id="report-detail-title"
                className="text-lg font-bold text-ink"
              >
                รายละเอียดรายงาน
              </h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="text-xl text-ink-soft/70 hover:text-ink"
                aria-label="ปิด"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-ink-soft">เนื้อหา</p>
                <p className="mt-1 whitespace-pre-wrap text-ink">
                  {detail.content}
                </p>
              </div>

              <div>
                <p className="text-xs text-ink-soft">ห้อง</p>
                <p className="mt-1 text-ink">{detail.room}</p>
              </div>

              <div>
                <p className="text-xs text-ink-soft">ผู้เขียน</p>
                <p className="mt-1 text-ink">{detail.author}</p>
              </div>

              <div>
                <p className="text-xs text-ink-soft">เหตุผลหลัก</p>
                <p className="mt-1 text-ink">
                  {getReasonLabel(detail.reason)}
                </p>
              </div>

              <div>
                <p className="text-xs text-ink-soft">จำนวนรายงาน</p>
                <p className="mt-1 text-ink">{detail.count}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDetail(null)}
              className="mt-6 w-full rounded-lg bg-ink py-3 text-sm font-medium text-white hover:bg-ink-soft"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
