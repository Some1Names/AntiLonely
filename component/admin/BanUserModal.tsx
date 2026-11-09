"use client";

import { useState } from "react";
import Modal from "@/component/Modal";
import Paper from "@/component/Paper";
import {
  checkboxClass,
  FormError,
  SanctionHeader,
  SanctionUserCard,
  type SanctionTarget,
} from "@/component/admin/SanctionParts";
import { banUser, type SanctionResult } from "@/lib/sanction-actions";
import { BAN_CONFIRM_WORD, isBanConfirmed } from "@/lib/sanctions";
import {
  dangerButtonClass,
  disabledButtonClass,
  hintClass,
  inputClass,
  labelClass,
  secondaryButtonClass,
} from "@/lib/styles";

// "แบนผู้ใช้ถาวร" dialog for the admin panel. Needs a reason and the word BAN
// typed out before the red button unlocks.
export default function BanUserModal({
  user,
  onClose,
  onDone,
  action = banUser,
}: {
  user: SanctionTarget;
  onClose: () => void;
  onDone?: () => void;
  // Swappable for previews; defaults to the real server action.
  action?: typeof banUser;
}) {
  const [reason, setReason] = useState("");
  const [deletePosts, setDeletePosts] = useState(false);
  const [notify, setNotify] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = reason.trim().length > 0 && isBanConfirmed(confirmText);

  async function confirm() {
    if (!ready) return;
    setPending(true);
    setError(null);
    let result: SanctionResult;
    try {
      result = await action({ userId: user.id, reason, deletePosts, notifyByEmail: notify });
    } catch {
      result = { ok: false, error: "มีบางอย่างผิดพลาด ลองใหม่อีกครั้ง" };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone?.();
    onClose();
  }

  return (
    <Modal labelledBy="ban-title" onClose={onClose} size="md" sheetName="admin-sheet">
      <Paper>
        <SanctionHeader
          titleId="ban-title"
          title="แบนผู้ใช้ถาวร"
          subtitle="การดำเนินการนี้ย้อนกลับได้ยาก โปรดตรวจสอบก่อนยืนยัน"
          tone="danger"
        />
        <SanctionUserCard user={user} badge="แบน" tone="danger" />

        <form
          className="mt-6 flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            confirm();
          }}
        >
          <div className="flex flex-col gap-2">
            <div>
              <label htmlFor="ban-reason" className={labelClass}>
                เหตุผลในการแบน <span className="text-red-700">*</span>
              </label>
              <p id="ban-reason-hint" className={hintClass}>
                จำเป็นต้องระบุ — จะถูกบันทึกใน Audit log
              </p>
            </div>
            <textarea
              id="ban-reason"
              rows={4}
              required
              maxLength={1000}
              aria-describedby="ban-reason-hint"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="เช่น คุกคามผู้ใช้อื่นซ้ำหลายครั้งหลังถูกระงับแล้ว"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={deletePosts}
                onChange={(event) => setDeletePosts(event.target.checked)}
                className={checkboxClass}
              />
              ลบโพสต์ทั้งหมดของผู้ใช้นี้ด้วย
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={notify}
                onChange={(event) => setNotify(event.target.checked)}
                className={checkboxClass}
              />
              แจ้งเตือนผู้ใช้ทางอีเมล
            </label>
          </div>

          <input
            type="text"
            aria-label={`พิมพ์ ${BAN_CONFIRM_WORD} เพื่อยืนยัน`}
            autoComplete="off"
            spellCheck={false}
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={`พิมพ์ "${BAN_CONFIRM_WORD}" เพื่อยืนยัน`}
            className={inputClass}
          />

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
              disabled={pending || !ready}
              className={`py-3 ${dangerButtonClass} ${disabledButtonClass}`}
            >
              {pending ? "กำลังแบน…" : "ยืนยันการแบน"}
            </button>
          </div>
        </form>
      </Paper>
    </Modal>
  );
}
