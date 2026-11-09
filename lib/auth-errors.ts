import { formatThaiDate } from "./sanctions";

// Thai messages for Better Auth error codes shown on the login/signup forms.
const messages: Record<string, string> = {
  USER_ALREADY_EXISTS: "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบดูนะ",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบดูนะ",
  INVALID_EMAIL_OR_PASSWORD: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  INVALID_EMAIL: "รูปแบบอีเมลไม่ถูกต้อง",
  PASSWORD_TOO_SHORT: "รหัสผ่านสั้นเกินไป",
  PASSWORD_TOO_LONG: "รหัสผ่านยาวเกินไป",
  // Set by the session hook in lib/auth.ts.
  ACCOUNT_BANNED: "บัญชีนี้ถูกแบนถาวร",
  ACCOUNT_SUSPENDED: "บัญชีนี้ถูกระงับชั่วคราว",
};

export function authErrorMessage(
  error: { code?: string; status?: number; suspendedUntil?: string | null } | null,
) {
  if (error?.status === 429) return "ลองบ่อยไปหน่อย พักสักครู่แล้วลองใหม่นะ";
  if (error?.code === "ACCOUNT_SUSPENDED" && error.suspendedUntil) {
    return `${messages.ACCOUNT_SUSPENDED} ถึง ${formatThaiDate(new Date(error.suspendedUntil))}`;
  }
  return (error?.code && messages[error.code]) || "มีบางอย่างผิดพลาด ลองใหม่อีกครั้งนะ";
}
