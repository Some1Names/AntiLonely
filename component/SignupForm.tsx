"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthCard, { AuthLink } from "@/component/AuthCard";
import GoogleButton from "@/component/GoogleButton";
import PasswordInput from "@/component/PasswordInput";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import {
  alertClass,
  disabledButtonClass,
  inputClass,
  primaryButtonClass,
} from "@/lib/styles";

const MIN_PASSWORD_LENGTH = 8;

export default function SignupForm({ inModal = false }: { inModal?: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [leftPassword, setLeftPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Don't scold while someone is still typing: show the length as a hint
  // first, and only turn it into an error after they leave the field or
  // submit. From then on it clears as soon as the password is long enough.
  const showPasswordError =
    password.length < MIN_PASSWORD_LENGTH &&
    (submitted || (leftPassword && password.length > 0));

  return (
    <AuthCard
      titleId="signup-title"
      title="ยินดีที่ได้รู้จักนะ 👋"
      subtitle="ตั้งชื่อเล่นที่อยากให้คนอื่นเห็น อีเมลของคุณจะไม่มีใครเห็นแน่นอน"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitted(true);
          if (password.length < MIN_PASSWORD_LENGTH) return;
          const formElement = event.currentTarget;
          const form = new FormData(formElement);
          setPending(true);
          setError(null);
          const { error } = await authClient.signUp.email({
            // The nickname is the name others see; the username is generated
            // on the server (see lib/auth.ts).
            name: String(form.get("nickname")).trim(),
            email: String(form.get("email")).trim(),
            password,
          });
          if (error) {
            setError(authErrorMessage(error));
            setPending(false);
            return;
          }
          // Next keeps this page alive (hidden) after leaving it, so clear the
          // form and the pending state before going.
          formElement.reset();
          setPassword("");
          setSubmitted(false);
          setLeftPassword(false);
          setPending(false);
          // Signed up and logged in. Going to / closes the modal; refresh lets
          // server components see the new session.
          router.push("/");
          router.refresh();
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
          <p id="signup-name-hint" className="text-xs text-ink-soft">
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
          <p id="signup-email-hint" className="text-xs text-ink-soft">
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
            onBlur={() => setLeftPassword(true)}
            invalid={showPasswordError}
            aria-describedby="signup-password-hint"
          />
          <p
            id="signup-password-hint"
            className={`text-xs ${showPasswordError ? "text-red-600" : "text-ink-soft"}`}
          >
            {showPasswordError
              ? `ขอยาวอีกนิดนะ อย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`
              : `อย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`}
          </p>
        </div>
        <label className="flex items-center gap-2 py-1 text-sm">
          <input type="checkbox" name="terms" required className="size-4 accent-kmutt-orange-dark" />
          <span>
            ฉันอ่านและยอมรับ <span className="underline decoration-kmutt-orange decoration-2 underline-offset-2">กติกาของชุมชน</span> แล้ว
          </span>
        </label>
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
          {pending ? "กำลังสมัคร…" : "สมัครเลยยย"}
        </button>
      </form>
      <GoogleButton label="สมัครด้วย Google" />
      <p className="mt-4 text-center text-sm text-ink-soft">
        มีบัญชีอยู่แล้ว?{" "}
        <AuthLink href="/login" inModal={inModal}>
          เข้าสู่ระบบ
        </AuthLink>
      </p>
    </AuthCard>
  );
}
