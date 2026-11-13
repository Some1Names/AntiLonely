"use client";

import { useEffect, useId, useRef, useState } from "react";

const MAX_NAME = 20;
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export type EditProfileResult = {
  name: string;
  /** undefined = ไม่เปลี่ยนรูป, null = ลบรูป, File = รูปใหม่ */
  image: File | null | undefined;
};

type Props = {
  initialName: string;
  initialImage?: string | null;
  onClose: () => void;
  onSave: (result: EditProfileResult) => Promise<void> | void;
};

// ใช้งานแบบ {open && <EditProfileModal ... />} เพื่อให้ state รีเซ็ตทุกครั้งที่เปิด
export default function EditProfileModal({
  initialName,
  initialImage = null,
  onClose,
  onSave,
}: Props) {
  const titleId = useId();
  const nameId = useId();

  const [name, setName] = useState(initialName);
  const [image, setImage] = useState<File | null | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  // เคลียร์ blob url ตอนปิด modal
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  // ล็อกการ scroll ของหน้าหลังตอนเปิด modal
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // กด Esc = ปิด modal
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saving, onClose]);

  function swapPreview(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewRef.current = url;
    setPreview(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // เลือกไฟล์เดิมซ้ำได้
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setError("รองรับเฉพาะไฟล์ JPG, PNG, WebP");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("ไฟล์ใหญ่เกิน 2 MB");
      return;
    }
    setError(null);
    swapPreview(file);
    setImage(file);
  }

  function handleRemove() {
    setError(null);
    swapPreview(null);
    setImage(null);
  }

  // image === null → ลบรูป, undefined → ใช้รูปเดิม, File → ใช้ preview
  const shownImage = image === null ? null : (preview ?? initialImage);

  const trimmed = name.trim();
  const imageChanged = image !== undefined && !(image === null && !initialImage);
  const nameChanged = trimmed !== initialName;
  const canSave = trimmed.length > 0 && (nameChanged || imageChanged) && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: trimmed, image });
      onClose();
    } catch {
      setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-ink/55 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative my-auto w-full max-w-[480px] rounded-[20px] border-[1.5px] border-ink bg-white p-5 text-ink sm:p-8 shadow-[6px_6px_0_rgba(59,36,23,0.3)]"
      >
        {/* เทปตกแต่ง */}
        <div
          aria-hidden="true"
          className="absolute -top-3.5 left-1/2 -ml-12 h-[26px] w-24 -rotate-2 bg-peach-edge"
        />

        {/* หัว modal */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="m-0 text-[22px] font-bold leading-snug">
              <span className="bg-highlight px-1.5">แก้ไขโปรไฟล์</span>
            </h2>
            <p className="m-0 text-sm leading-normal text-ink-soft">
              ปรับรูปและชื่อที่คนอื่นเห็นในกระทู้
            </p>
          </div>
          <button
            type="button"
            aria-label="ปิด"
            onClick={onClose}
            disabled={saving}
            className="-mr-2 -mt-1.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-ink bg-white disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* รูปโปรไฟล์ + ปุ่มอัปโหลด/ลบ */}
        <div className="mt-7 flex flex-wrap items-center gap-6">
          <div className="relative h-28 w-28 shrink-0">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-ink bg-peach">
              {shownImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                </svg>
              )}
            </div>
            <button
              type="button"
              aria-label="เปลี่ยนรูปโปรไฟล์"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1.5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-ink bg-kmutt-yellow"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-start gap-2.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-ink bg-kmutt-yellow px-4 text-[15px] font-semibold"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
              </svg>
              อัปโหลดรูปใหม่
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={!shownImage}
              className="h-9 cursor-pointer border-0 bg-transparent px-1 text-sm font-medium text-red-700 underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              ลบรูปปัจจุบัน
            </button>
            <p className="m-0 text-xs leading-normal text-ink-soft">
              รองรับ JPG, PNG, WebP ขนาดไม่เกิน 2 MB
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="mb-6 mt-7 border-t-[1.5px] border-dashed border-edge-strong" />

        {/* ชื่อเล่น */}
        <div className="flex flex-col gap-2">
          <label htmlFor={nameId} className="text-sm font-semibold">
            ชื่อเล่น
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            className="h-12 w-full rounded-xl border-[1.5px] border-ink bg-paper px-3.5 text-base text-ink"
          />
          <div className="flex items-start justify-between gap-3 text-xs leading-normal text-ink-soft">
            <div className="flex items-start gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-[3px] shrink-0">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 018 0v3" />
              </svg>
              <span>คนอื่นจะเห็นแค่ชื่อเล่นของคุณในกระทู้</span>
            </div>
            <span className="shrink-0">
              {name.length}/{MAX_NAME}
            </span>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {/* ปุ่มล่าง */}
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 cursor-pointer rounded-xl border-[1.5px] border-ink bg-white px-5 text-[15px] font-semibold disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="h-11 cursor-pointer rounded-xl border-[1.5px] border-ink bg-kmutt-yellow px-6 text-[15px] font-bold shadow-[2px_2px_0_var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}