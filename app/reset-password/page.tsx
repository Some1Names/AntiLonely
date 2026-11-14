import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "@/component/ResetPasswordForm";

export const metadata: Metadata = {
  title: "ตั้งรหัสผ่านใหม่ | AntiLonely",
  // The URL carries the reset token: don't hand it to other sites.
  referrer: "no-referrer",
};

// Where the emailed reset link lands, by way of Better Auth's
// /api/auth/reset-password/<token>, which adds ?token=… or, for a link that
// has expired or was already used, ?error=INVALID_TOKEN. Never intercepted
// as a modal: it's always opened from outside the app.
export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      {/* The form reads the token from the URL, which isn't known when the
          page is prerendered. */}
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
