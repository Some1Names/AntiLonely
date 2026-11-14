"use client";

import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import AuthCard, { AuthLink } from "@/component/AuthCard";
import PasswordInput from "@/component/PasswordInput";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import {
  alertClass,
  disabledButtonClass,
  outlineButtonClass,
  primaryButtonClass,
} from "@/lib/styles";

// Errors that mean the link itself is no good: start over with a new one.
const deadLinkCodes = new Set(["INVALID_TOKEN", "USER_NOT_FOUND"]);

// The page the emailed reset link opens: choose a new password. Its links
// are full-page loads (AuthLink outside a modal): this page is never shown
// in the auth modal, so /login opens as its own page too.
export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [leftPassword, setLeftPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deadLink, setDeadLink] = useState(false);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Next hides this page when leaving it instead of unmounting it; don't
  // keep the typed password around.
  useLayoutEffect(() => {
    const form = formRef.current;
    return () => {
      form?.reset();
      setPassword("");
      setLeftPassword(false);
      setSubmitted(false);
      setPending(false);
      setError(null);
    };
  }, []);

  const showPasswordError =
    password.length < MIN_PASSWORD_LENGTH &&
    (submitted || (leftPassword && password.length > 0));

  if (done) {
    return (
      <AuthCard
        titleId="reset-title"
        title="เปลี่ยนรหัสผ่านแล้ว 🎉"
        subtitle="เราออกจากระบบให้ทุกเครื่องแล้ว เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย"
      >
        <AuthLink
          href="/login"
          inModal={false}
          className={`flex justify-center py-2.5 ${primaryButtonClass}`}
        >
          ไปเข้าสู่ระบบ
        </AuthLink>
      </AuthCard>
    );
  }

  if (!token || linkError || deadLink) {
    return (
      <AuthCard
        titleId="reset-title"
        title="ลิงก์นี้ใช้ไม่ได้แล้ว"
        subtitle="ลิงก์ตั้งรหัสผ่านใหม่อาจหมดอายุ ถูกใช้ไปแล้ว หรือคัดลอกมาไม่ครบ ขอลิงก์ใหม่ได้เลย"
      >
        <div className="flex flex-col gap-3">
          <AuthLink
            href="/forgot-password"
            inModal={false}
            className={`flex justify-center py-2.5 ${primaryButtonClass}`}
          >
            ขอลิงก์ใหม่
          </AuthLink>
          <AuthLink
            href="/login"
            inModal={false}
            className={`flex justify-center py-2.5 ${outlineButtonClass}`}
          >
            กลับไปเข้าสู่ระบบ
          </AuthLink>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      titleId="reset-title"
      title="ตั้งรหัสผ่านใหม่"
      subtitle="เลือกรหัสผ่านใหม่ที่จำได้ แต่คนอื่นเดาไม่ออก"
    >
      <form
        ref={formRef}
        // If this is submitted before the page's script has loaded, the
        // browser sends it itself: post keeps the password out of the URL.
        method="post"
        className="flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitted(true);
          if (password.length < MIN_PASSWORD_LENGTH) return;
          setPending(true);
          setError(null);
          const { error } = await authClient.resetPassword({
            newPassword: password,
            token,
          });
          setPending(false);
          if (error) {
            if (error.code && deadLinkCodes.has(error.code)) setDeadLink(true);
            else setError(authErrorMessage(error));
            return;
          }
          setPassword("");
          setDone(true);
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="reset-password" className="text-sm font-semibold">
            รหัสผ่านใหม่
          </label>
          <PasswordInput
            id="reset-password"
            name="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setLeftPassword(true)}
            invalid={showPasswordError}
            aria-describedby="reset-password-hint"
          />
          <p
            id="reset-password-hint"
            className={`text-xs ${showPasswordError ? "text-red-600" : "text-ink-soft"}`}
          >
            {showPasswordError
              ? `ขอยาวอีกนิดนะ อย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`
              : `อย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`}
          </p>
        </div>
        {error && (
          <p role="alert" className={alertClass}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className={`py-2.5 ${primaryButtonClass} ${disabledButtonClass}`}
        >
          {pending ? "กำลังบันทึก…" : "ตั้งรหัสผ่านใหม่"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        นึกรหัสเดิมออกแล้ว?{" "}
        <AuthLink href="/login" inModal={false}>
          เข้าสู่ระบบ
        </AuthLink>
      </p>
    </AuthCard>
  );
}
