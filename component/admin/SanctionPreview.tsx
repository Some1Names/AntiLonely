"use client";

import { useState } from "react";
import BanUserModal from "@/component/admin/BanUserModal";
import type { SanctionTarget } from "@/component/admin/SanctionParts";
import SuspendUserModal from "@/component/admin/SuspendUserModal";
import Icon from "@/component/Icon";
import { formatThaiDate } from "@/lib/sanctions";
import {
  dangerButtonClass,
  highlightClass,
  primaryButtonClass,
} from "@/lib/styles";

const suspendTarget: SanctionTarget = { id: "preview-1", username: "anon_012", email: "claire@outlook.com" };
const banTarget: SanctionTarget = { id: "preview-2", username: "anon_204", email: "dave@gmail.com" };

// Stand-in for the server actions: waits a moment, saves nothing.
async function fakeAction() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { ok: true as const };
}

export default function SanctionPreview() {
  const [open, setOpen] = useState<"suspend" | "ban" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">
        <span className={highlightClass}>ตัวอย่างหน้าต่างผู้ดูแลระบบ</span>
      </h1>
      <p className="text-sm text-ink-soft">
        หน้านี้มีเฉพาะตอนพัฒนา ใช้ผู้ใช้ปลอมและไม่บันทึกอะไรลงฐานข้อมูล
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpen("suspend")}
          className={`px-4 py-2.5 ${primaryButtonClass}`}
        >
          ระงับ anon_012
        </button>
        <button
          type="button"
          onClick={() => setOpen("ban")}
          className={`px-4 py-2.5 ${dangerButtonClass}`}
        >
          แบน anon_204
        </button>
      </div>
      {message && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border-[1.5px] border-ink bg-butter px-4 py-3 text-sm shadow-sticker"
        >
          <Icon name="check" className="size-4 text-green-700" />
          {message}
        </p>
      )}

      {open === "suspend" && (
        <SuspendUserModal
          user={suspendTarget}
          action={fakeAction}
          onClose={() => setOpen(null)}
          onDone={(endAt) => setMessage(`ระงับ ${suspendTarget.username} ถึง ${formatThaiDate(endAt)} แล้ว (ตัวอย่าง)`)}
        />
      )}
      {open === "ban" && (
        <BanUserModal
          user={banTarget}
          action={fakeAction}
          onClose={() => setOpen(null)}
          onDone={() => setMessage(`แบน ${banTarget.username} แล้ว (ตัวอย่าง)`)}
        />
      )}
    </main>
  );
}
