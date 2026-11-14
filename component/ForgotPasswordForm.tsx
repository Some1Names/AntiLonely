"use client";

import { useLayoutEffect, useRef, useState } from "react";
import AuthCard, { AuthLink } from "@/component/AuthCard";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { RESET_LINK_LIFETIME_SECONDS } from "@/lib/email";
import {
  alertClass,
  disabledButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/styles";

// ลืมรหัสผ่าน: asks for the email and has Better Auth send a reset link. The
// answer is the same whether or not the email has an account, so this can't
// be used to find out who is signed up.
export default function ForgotPasswordForm({ inModal = false }: { inModal?: boolean }) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Next hides this form on close instead of unmounting it; the next open
  // starts over with an empty form.
  useLayoutEffect(() => {
    const form = formRef.current;
    return () => {
      form?.reset();
      setPending(false);
      setSent(false);
      setError(null);
    };
  }, []);

  return (
    <AuthCard
      titleId="forgot-title"
      title={sent ? "เช็กอีเมลได้เลย 📬" : "ลืมรหัสผ่านเหรอ"}
      subtitle={
        sent
          ? "ถ้ามีบัญชีนี้ เราส่งลิงก์ไปให้แล้ว"
          : "ใส่อีเมลที่ใช้สมัคร เดี๋ยวเราส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้"
      }
    >
      {sent && (
        <div className="flex flex-col gap-4 text-sm">
          <p role="status" className="rounded-lg border-[1.5px] border-butter-edge bg-butter px-3 py-2">
            ลิงก์ใช้ได้ครั้งเดียว ภายใน {RESET_LINK_LIFETIME_SECONDS / 60} นาที
            ถ้าไม่เห็นอีเมล ลองดูในโฟลเดอร์สแปมด้วยนะ
          </p>
          <p className="text-ink-soft">
            ถ้าบัญชีนี้สมัครด้วย Google จะไม่มีรหัสผ่านให้ตั้งใหม่
            กด “เข้าสู่ระบบด้วย Google” ได้เลย
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className={`py-2 ${secondaryButtonClass}`}
          >
            ส่งใหม่อีกครั้ง
          </button>
        </div>
      )}
      {/* Hidden rather than unmounted after sending, so "ส่งใหม่อีกครั้ง"
          comes back with the email still filled in. */}
      <form
        ref={formRef}
        hidden={sent}
        // Without script the browser sends this itself: post keeps the
        // email out of the URL.
        method="post"
        className="flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const email = String(new FormData(event.currentTarget).get("email")).trim();
          setPending(true);
          setError(null);
          const { error } = await authClient.requestPasswordReset({
            email,
            // The emailed link checks the token, then lands here.
            redirectTo: "/reset-password",
          });
          setPending(false);
          if (error) {
            setError(authErrorMessage(error));
            return;
          }
          setSent(true);
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="forgot-email" className="text-sm font-semibold">
            อีเมล
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className={inputClass}
          />
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
          {pending ? "กำลังส่ง…" : "ส่งลิงก์ให้หน่อย"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        นึกออกแล้ว?{" "}
        <AuthLink href="/login" inModal={inModal}>
          กลับไปเข้าสู่ระบบ
        </AuthLink>
      </p>
    </AuthCard>
  );
}
