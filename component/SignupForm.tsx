"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AuthCard, { AuthLink } from "@/component/AuthCard";
import CommunityRules from "@/component/CommunityRules";
import GoogleButton from "@/component/GoogleButton";
import PasswordInput from "@/component/PasswordInput";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import {
  alertClass,
  disabledButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/styles";

export default function SignupForm({ inModal = false }: { inModal?: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [leftPassword, setLeftPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The rules open in place of the form, in this same card, instead of in a
  // second modal or another page: the form is only hidden, so what was typed
  // stays, and the auth modal's focus trap and Escape keep working.
  const [showRules, setShowRules] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);
  const rulesLinkRef = useRef<HTMLAnchorElement>(null);
  const rulesTopRef = useRef<HTMLDivElement>(null);
  // Where focus goes once the view has switched (after the render).
  const focusAfterSwitch = useRef<"rules" | "form" | null>(null);

  useLayoutEffect(() => {
    const target = focusAfterSwitch.current;
    if (!target) return;
    focusAfterSwitch.current = null;
    if (target === "rules") {
      // Start reading from the card's title, which now says กติกาของชุมชน.
      rulesTopRef.current?.focus({ preventScroll: true });
      document.getElementById("signup-title")?.scrollIntoView({ block: "nearest" });
    } else {
      rulesLinkRef.current?.focus({ preventScroll: true });
      rulesLinkRef.current?.scrollIntoView({ block: "center" });
    }
  }, [showRules]);

  // While the rules show, Escape goes back to the form instead of closing the
  // modal. Modal listens on window in the bubble phase; this capture listener
  // on window runs first and stops it, wherever focus is.
  useEffect(() => {
    if (!showRules) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      focusAfterSwitch.current = "form";
      setShowRules(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [showRules]);

  function openRules() {
    focusAfterSwitch.current = "rules";
    setShowRules(true);
  }

  function closeRules(accept: boolean) {
    if (accept && termsRef.current) termsRef.current.checked = true;
    focusAfterSwitch.current = "form";
    setShowRules(false);
  }

  // Next hides this form on close instead of unmounting it. Without this the
  // next open would still show the last error and the typed password.
  useLayoutEffect(() => {
    const form = formRef.current;
    return () => {
      form?.reset();
      setPassword("");
      setLeftPassword(false);
      setSubmitted(false);
      setError(null);
      setPending(false);
      setShowRules(false);
    };
  }, []);

  // Don't scold while someone is still typing: show the length as a hint
  // first, and only turn it into an error after they leave the field or
  // submit. From then on it clears as soon as the password is long enough.
  const showPasswordError =
    password.length < MIN_PASSWORD_LENGTH &&
    (submitted || (leftPassword && password.length > 0));

  return (
    <AuthCard
      titleId="signup-title"
      title={showRules ? "กติกาของชุมชน" : "ยินดีที่ได้รู้จักนะ 👋"}
      subtitle={
        showRules
          ? "อ่านจบแล้วกลับไปสมัครต่อได้เลย ที่พิมพ์ไว้ยังอยู่ครบ"
          : "ตั้งชื่อเล่นที่อยากให้คนอื่นเห็น อีเมลของคุณจะไม่มีใครเห็นแน่นอน"
      }
    >
      {showRules && (
        <div>
          <div ref={rulesTopRef} tabIndex={-1} className="outline-none">
            <CommunityRules />
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => closeRules(true)}
              className={`py-2.5 ${primaryButtonClass}`}
            >
              โอเค ยอมรับกติกา
            </button>
            <button
              type="button"
              onClick={() => closeRules(false)}
              className={`py-2 ${secondaryButtonClass}`}
            >
              ← กลับไปหน้าสมัคร
            </button>
          </div>
        </div>
      )}
      {/* Hidden, not unmounted, while the rules are open. */}
      <div hidden={showRules}>
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
          <div className="flex items-center gap-2 py-1 text-sm">
            <input
              ref={termsRef}
              id="signup-terms"
              type="checkbox"
              name="terms"
              required
              className="size-4 shrink-0 accent-kmutt-orange-dark"
            />
            {/* The link sits beside the label, not inside it, so clicking it
                doesn't tick the box. Without script it opens the /rules page. */}
            <p>
              <label htmlFor="signup-terms">ฉันอ่านและยอมรับ</label>{" "}
              <Link
                ref={rulesLinkRef}
                href="/rules"
                prefetch={false}
                onClick={(event) => {
                  // Let modifier clicks open the page in a new tab as usual.
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                  event.preventDefault();
                  openRules();
                }}
                className="font-semibold underline decoration-kmutt-orange decoration-2 underline-offset-2 hover:text-kmutt-orange-dark"
              >
                กติกาของชุมชน
              </Link>{" "}
              <label htmlFor="signup-terms">แล้ว</label>
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
      </div>
    </AuthCard>
  );
}
