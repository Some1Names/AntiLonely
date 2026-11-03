"use client";

import AuthCard, { AuthLink } from "@/component/AuthCard";
import PasswordInput from "@/component/PasswordInput";
import { inputClass, primaryButtonClass } from "@/lib/styles";

export default function LoginForm({ inModal = false }: { inModal?: boolean }) {
  return (
    <AuthCard
      titleId="login-title"
      title="ดีใจที่กลับมานะ"
      subtitle="เข้าสู่ระบบแล้วไปคุยกันต่อเลย"
    >
      {/* No backend yet, so submitting does nothing. */}
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="text-sm font-semibold">
            อีเมล
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-semibold">
              รหัสผ่าน
            </label>
            <button
              type="button"
              className="py-1 text-xs text-ink-soft hover:text-kmutt-orange-dark"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            required
          />
        </div>
        <button
          type="submit"
          className={`py-2.5 ${primaryButtonClass}`}
        >
          เข้าสู่ระบบ
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        ยังไม่มีบัญชีเหรอ?{" "}
        <AuthLink href="/signup" inModal={inModal}>
          สมัครเลย
        </AuthLink>
      </p>
    </AuthCard>
  );
}
