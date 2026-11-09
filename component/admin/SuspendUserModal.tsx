"use client";

import { useState } from "react";
import Modal from "@/component/Modal";
import Paper from "@/component/Paper";
import {
  checkboxClass,
  FormError,
  presetClass,
  SanctionHeader,
  SanctionUserCard,
  type SanctionTarget,
} from "@/component/admin/SanctionParts";
import { suspendUser, type SanctionResult } from "@/lib/sanction-actions";
import {
  disabledButtonClass,
  fieldFrameClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  radioClass,
  secondaryButtonClass,
} from "@/lib/styles";
import {
  addDuration,
  dateInputToEnd,
  DURATION_UNIT_LABELS,
  formatThaiDate,
  MAX_SUSPENSION_DAYS,
  SUSPENSION_PRESET_DAYS,
  suspensionEndsWithinLimit,
  toDateInputValue,
  type DurationUnit,
} from "@/lib/sanctions";

type Preset = (typeof SUSPENSION_PRESET_DAYS)[number] | "custom";
type CustomMode = "amount" | "date";

// Largest amount per unit, so the stepper stays within MAX_SUSPENSION_DAYS.
const MAX_AMOUNT: Record<DurationUnit, number> = { day: MAX_SUSPENSION_DAYS, week: 52, month: 12 };
const DAY_MS = 24 * 60 * 60 * 1000;

// "ระงับผู้ใช้ชั่วคราว" dialog for the admin panel. Pick 7/14/30 days or a
// custom length (an amount of days/weeks/months, or an end date).
export default function SuspendUserModal({
  user,
  onClose,
  onDone,
  action = suspendUser,
}: {
  user: SanctionTarget;
  onClose: () => void;
  onDone?: (endAt: Date) => void;
  // Swappable for previews; defaults to the real server action.
  action?: typeof suspendUser;
}) {
  // When the dialog opened; end dates shown are counted from here.
  const [openedAt] = useState(() => new Date());
  const [preset, setPreset] = useState<Preset>(SUSPENSION_PRESET_DAYS[0]);
  const [mode, setMode] = useState<CustomMode>("amount");
  const [amount, setAmount] = useState(45);
  const [unit, setUnit] = useState<DurationUnit>("day");
  const [dateValue, setDateValue] = useState("");
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function endFrom(start: Date): Date | null {
    if (preset !== "custom") return addDuration(start, preset, "day");
    if (mode === "amount") return amount > 0 ? addDuration(start, amount, unit) : null;
    return dateInputToEnd(dateValue);
  }

  const end = endFrom(openedAt);
  const endValid = end !== null && suspensionEndsWithinLimit(end, openedAt);

  const confirmLabel =
    preset !== "custom"
      ? "ยืนยันการระงับ"
      : mode === "amount"
        ? `ระงับ ${amount} ${DURATION_UNIT_LABELS[unit]}`
        : end
          ? `ระงับถึง ${formatThaiDate(end)}`
          : "ยืนยันการระงับ";

  function changeUnit(next: DurationUnit) {
    setUnit(next);
    setAmount((value) => Math.min(value, MAX_AMOUNT[next]));
  }

  async function confirm() {
    // Count from now rather than from when the dialog opened.
    const endAt = endFrom(new Date());
    if (!endAt || !suspensionEndsWithinLimit(endAt)) {
      setError(`เลือกวันสิ้นสุดภายใน ${MAX_SUSPENSION_DAYS} วันนับจากวันนี้`);
      return;
    }
    setPending(true);
    setError(null);
    let result: SanctionResult;
    try {
      result = await action({ userId: user.id, endAt: endAt.toISOString(), reason, notifyByEmail: notify });
    } catch {
      result = { ok: false, error: "มีบางอย่างผิดพลาด ลองใหม่อีกครั้ง" };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone?.(endAt);
    onClose();
  }

  return (
    <Modal labelledBy="suspend-title" onClose={onClose} size="md" sheetName="admin-sheet">
      <Paper>
        <SanctionHeader
          titleId="suspend-title"
          title="ระงับผู้ใช้ชั่วคราว"
          subtitle="ผู้ใช้จะใช้งานไม่ได้จนกว่าจะครบกำหนด"
          tone="warning"
        />
        <SanctionUserCard user={user} badge="ระงับ" tone="warning" />

        <form
          className="mt-6 flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            confirm();
          }}
        >
          <fieldset>
            <legend className={labelClass}>ระยะเวลาการระงับ</legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[...SUSPENSION_PRESET_DAYS, "custom" as const].map((value) => (
                <label key={value} className={presetClass}>
                  <input
                    type="radio"
                    name="suspend-preset"
                    className="sr-only"
                    checked={preset === value}
                    onChange={() => setPreset(value)}
                  />
                  {value === "custom" ? "กำหนดเอง" : `${value} วัน`}
                </label>
              ))}
            </div>
          </fieldset>

          {preset === "custom" && (
            <fieldset className="rounded-lg border-[1.5px] border-dashed border-edge-strong bg-cream p-4">
              <legend className="sr-only">ระยะเวลาที่กำหนดเอง</legend>

              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="radio"
                  name="suspend-custom-mode"
                  className={radioClass}
                  checked={mode === "amount"}
                  onChange={() => setMode("amount")}
                />
                ระบุจำนวน
              </label>
              <div
                className={`mt-3 flex flex-wrap items-center gap-3 pl-6 ${mode === "amount" ? "" : "pointer-events-none opacity-40"}`}
              >
                {/* The frame lights up like any field while the number is
                    being typed. The steppers draw their focus outline inside,
                    since the frame clips anything outside it. */}
                <div className="flex h-12 overflow-hidden rounded-lg border-[1.5px] border-edge-strong bg-white has-[input:focus]:border-kmutt-orange has-[input:focus]:ring-3 has-[input:focus]:ring-kmutt-yellow/40">
                  <input
                    type="number"
                    aria-label="จำนวน"
                    inputMode="numeric"
                    min={1}
                    max={MAX_AMOUNT[unit]}
                    value={amount || ""}
                    disabled={mode !== "amount"}
                    onChange={(event) => {
                      const value = Math.floor(Number(event.target.value));
                      setAmount(Number.isFinite(value) ? Math.min(Math.max(value, 0), MAX_AMOUNT[unit]) : 0);
                    }}
                    className="w-20 bg-transparent text-center text-lg font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label="ลดจำนวน"
                    disabled={mode !== "amount" || amount <= 1}
                    onClick={() => setAmount((value) => Math.max(1, value - 1))}
                    className="w-10 border-l-[1.5px] border-edge-strong text-lg hover:bg-butter focus-visible:-outline-offset-4 disabled:text-edge-strong disabled:hover:bg-transparent"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label="เพิ่มจำนวน"
                    disabled={mode !== "amount" || amount >= MAX_AMOUNT[unit]}
                    onClick={() => setAmount((value) => Math.min(MAX_AMOUNT[unit], value + 1))}
                    className="w-10 border-l-[1.5px] border-edge-strong text-lg hover:bg-butter focus-visible:-outline-offset-4 disabled:text-edge-strong disabled:hover:bg-transparent"
                  >
                    +
                  </button>
                </div>
                <select
                  aria-label="หน่วย"
                  value={unit}
                  disabled={mode !== "amount"}
                  onChange={(event) => changeUnit(event.target.value as DurationUnit)}
                  className={`h-12 max-w-28 px-3 text-center ${fieldFrameClass}`}
                >
                  {(Object.keys(DURATION_UNIT_LABELS) as DurationUnit[]).map((key) => (
                    <option key={key} value={key}>
                      {DURATION_UNIT_LABELS[key]}
                    </option>
                  ))}
                </select>
                {mode === "amount" && end && (
                  <span className="text-sm text-ink-soft">สิ้นสุด {formatThaiDate(end)}</span>
                )}
              </div>

              <div className="my-4 flex items-center gap-3 text-xs text-ink-soft">
                <span className="flex-1 border-t-[1.5px] border-dashed border-edge-strong" />
                หรือ
                <span className="flex-1 border-t-[1.5px] border-dashed border-edge-strong" />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="radio"
                  name="suspend-custom-mode"
                  className={radioClass}
                  checked={mode === "date"}
                  onChange={() => setMode("date")}
                />
                เลือกวันที่สิ้นสุดเอง
              </label>
              <div className={`mt-3 pl-6 ${mode === "date" ? "" : "pointer-events-none opacity-40"}`}>
                <input
                  type="date"
                  aria-label="วันที่สิ้นสุด"
                  value={dateValue}
                  disabled={mode !== "date"}
                  min={toDateInputValue(new Date(openedAt.getTime() + DAY_MS))}
                  max={toDateInputValue(new Date(openedAt.getTime() + MAX_SUSPENSION_DAYS * DAY_MS))}
                  onChange={(event) => setDateValue(event.target.value)}
                  className={`${inputClass} max-w-56`}
                />
              </div>
            </fieldset>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="suspend-reason" className={labelClass}>
              เหตุผลในการระงับ
            </label>
            <textarea
              id="suspend-reason"
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="เช่น สแปมซ้ำหลายครั้งในห้อง General Chat"
              className={`${inputClass} resize-none`}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={notify}
              onChange={(event) => setNotify(event.target.checked)}
              className={checkboxClass}
            />
            แจ้งเตือนผู้ใช้ทางอีเมล
          </label>

          <FormError message={error} />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className={`py-3 ${secondaryButtonClass} disabled:opacity-50`}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending || !endValid}
              className={`py-3 ${primaryButtonClass} ${disabledButtonClass}`}
            >
              {pending ? "กำลังระงับ…" : confirmLabel}
            </button>
          </div>
        </form>
      </Paper>
    </Modal>
  );
}
