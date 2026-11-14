import type { Metadata } from "next";
import ForgotPasswordForm from "@/component/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "ลืมรหัสผ่าน | AntiLonely",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <ForgotPasswordForm />
    </main>
  );
}
