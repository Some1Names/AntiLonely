"use client";

import { useState } from "react";
import Modal from "@/component/Modal";
import Sheet from "@/component/Sheet";
import {
  choiceClass,
  disabledButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  radioClass,
  secondaryButtonClass,
} from "@/lib/styles";

export const reportReasons = [
  { id: "harassment", label: "กลั่นแกล้งหรือคุกคาม" },
  { id: "hate", label: "ถ้อยคำสร้างความเกลียดชัง" },
  { id: "spam", label: "สแปมหรือหลอกลวง" },
  { id: "doxxing", label: "เปิดเผยข้อมูลส่วนตัวของคนอื่น" },
  { id: "sexual-violent", label: "เนื้อหาทางเพศหรือความรุนแรง" },
  { id: "self-harm", label: "มีคนอาจกำลังคิดทำร้ายตัวเอง" },
  { id: "other", label: "อย่างอื่น" },
] as const;

export type ReportReason = (typeof reportReasons)[number]["id"];

export type ReportedComment = {
  author: string;
  roomName: string;
  text: string;
};

// Reports a comment on the board feed. The reporter stays anonymous. No
// backend yet, so onSubmit gets the report and the caller decides what to do.
export default function ReportModal({
  comment,
  onClose,
  onSubmit,
}: {
  comment: ReportedComment;
  onClose: () => void;
  onSubmit?: (report: { reason: ReportReason; details: string }) => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);

  return (
    <Modal labelledBy="report-title" onClose={onClose} size="md" sheetName="report-sheet">
      <Sheet titleId="report-title" title="รายงานความคิดเห็นนี้">
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!reason) return;
            const details = new FormData(event.currentTarget).get("details");
            onSubmit?.({ reason, details: String(details ?? "").trim() });
            onClose();
          }}
        >
          <figure className="rounded-md border border-dashed border-edge-strong bg-cream px-4 py-3">
            <figcaption className="text-xs text-ink-soft">
              {comment.author} · ใน{comment.roomName}
            </figcaption>
            <blockquote className="mt-1 line-clamp-2 text-sm">
              “{comment.text}”
            </blockquote>
          </figure>

          <fieldset className="flex flex-col gap-2">
            <legend className={`mb-1 ${labelClass}`}>เกิดอะไรขึ้นเหรอ?</legend>
            {reportReasons.map((item) => (
              <label key={item.id} className={`${choiceClass} items-center`}>
                <input
                  type="radio"
                  name="reason"
                  value={item.id}
                  required
                  checked={reason === item.id}
                  onChange={() => setReason(item.id)}
                  className={radioClass}
                />
                {item.label}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1">
            <label htmlFor="report-details" className={labelClass}>
              อยากเล่าเพิ่มไหม <span className="font-normal text-ink-soft">(ไม่บังคับ)</span>
            </label>
            <textarea
              id="report-details"
              name="details"
              rows={2}
              maxLength={500}
              placeholder="อะไรก็ได้ที่ช่วยให้ทีมงานดูแลได้เร็วขึ้น"
              className={`resize-y ${inputClass}`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-ink-soft">
              <LockIcon />
              ไม่มีใครรู้ว่าคุณเป็นคนรายงาน
            </p>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 ${secondaryButtonClass}`}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!reason}
                className={`px-4 py-2 ${primaryButtonClass} ${disabledButtonClass}`}
              >
                ส่งรายงาน
              </button>
            </div>
          </div>
        </form>
      </Sheet>
    </Modal>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
