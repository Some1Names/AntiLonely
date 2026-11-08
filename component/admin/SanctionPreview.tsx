"use client";

import { useState } from "react";
import BanUserModal from "@/component/admin/BanUserModal";
import type { SanctionTarget } from "@/component/admin/SanctionParts";
import SuspendUserModal from "@/component/admin/SuspendUserModal";
import { formatThaiDate } from "@/lib/sanctions";

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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">ตัวอย่างหน้าต่างผู้ดูแลระบบ</h1>
      <p className="text-sm text-neutral-500">
        หน้านี้มีเฉพาะตอนพัฒนา ใช้ผู้ใช้ปลอมและไม่บันทึกอะไรลงฐานข้อมูล
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen("suspend")}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          ระงับ anon_012
        </button>
        <button
          type="button"
          onClick={() => setOpen("ban")}
          className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          แบน anon_204
        </button>
      </div>
      {message && (
        <p role="status" className="rounded-lg bg-neutral-100 px-4 py-3 text-sm">
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
