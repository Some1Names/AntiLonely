"use client";

import { useState } from "react";
import AuthCard, { AuthLink, inputClass } from "@/component/AuthCard";
import PasswordInput from "@/component/PasswordInput";

const MIN_PASSWORD_LENGTH = 8;

export default function SignupForm({ inModal = false }: { inModal?: boolean }) {
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const showPasswordError =
    password.length < MIN_PASSWORD_LENGTH &&
    (submitted || password.length > 0);

  return (
    <AuthCard
      titleId="signup-title"
      title="ยินดีที่ได้รู้จักนะ 👋"
      subtitle="ตั้งชื่อเล่นที่อยากให้คนอื่นเห็น อีเมลของคุณจะไม่มีใครเห็นแน่นอน"
    >
      {/* No backend yet, so submitting only checks the password length. */}
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="signup-name" className="text-sm font-semibold">
            ชื่อเล่น
          </label>
          <input
            id="signup-name"
            name="nickname"
            type="text"
            autoComplete="nickname"
            placeholder="เช่น คิตตี้"
            required
            aria-describedby="signup-name-hint"
            className={inputClass}
          />
          <p id="signup-name-hint" className="text-xs text-zinc-500">
            ไม่ต้องใช้ชื่อจริงนะ ตั้งอะไรก็ได้ที่ชอบ
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="signup-email" className="text-sm font-semibold">
            อีเมล (อันนี้ไม่บอกใคร)
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-describedby="signup-email-hint"
            className={inputClass}
          />
          <p id="signup-email-hint" className="text-xs text-zinc-500">
            ใช้แค่ตอนล็อกอินกับลืมรหัสผ่านเท่านั้น
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="signup-password" className="text-sm font-semibold">
            รหัสผ่าน
          </label>
          <PasswordInput
            id="signup-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            invalid={showPasswordError}
            aria-describedby={
              showPasswordError ? "signup-password-error" : undefined
            }
          />
          {showPasswordError && (
            <p id="signup-password-error" className="text-xs text-red-600">
              ขอยาวอีกนิดนะ อย่างน้อย {MIN_PASSWORD_LENGTH} ตัวอักษร
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="terms" required className="size-4" />
          <span>
            ฉันอ่านและยอมรับ <span className="underline">กติกาของชุมชน</span> แล้ว
          </span>
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-800 py-2.5 text-sm font-semibold text-white"
        >
          สมัครเลยยย
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500">
        มีบัญชีอยู่แล้ว?{" "}
        <AuthLink href="/login" inModal={inModal}>
          เข้าสู่ระบบ
        </AuthLink>
      </p>
    </AuthCard>
  );
}
