"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthCard, { AuthLink } from "@/component/AuthCard";
import GoogleButton from "@/component/GoogleButton";
import PasswordInput from "@/component/PasswordInput";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { disabledButtonClass, inputClass, primaryButtonClass } from "@/lib/styles";

export default function LoginForm({ inModal = false }: { inModal?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthCard
      titleId="login-title"
      title="ดีใจที่กลับมานะ"
      subtitle="เข้าสู่ระบบแล้วไปคุยกันต่อเลย"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const form = new FormData(formElement);
          setPending(true);
          setError(null);
          const { error } = await authClient.signIn.email({
            email: String(form.get("email")).trim(),
            password: String(form.get("password")),
          });
          if (error) {
            setError(authErrorMessage(error));
            setPending(false);
            return;
          }
          // Next keeps this page alive (hidden) after leaving it, so clear the
          // typed password and the pending state before going.
          formElement.reset();
          setPending(false);
          // Going to / closes the modal; refresh lets server components see the session.
          router.push("/");
          router.refresh();
        }}
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
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className={`py-2.5 ${primaryButtonClass} ${disabledButtonClass}`}
        >
          {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
      <GoogleButton label="เข้าสู่ระบบด้วย Google" />
      <p className="mt-4 text-center text-sm text-ink-soft">
        ยังไม่มีบัญชีเหรอ?{" "}
        <AuthLink href="/signup" inModal={inModal}>
          สมัครเลย
        </AuthLink>
      </p>
    </AuthCard>
  );
}
