import { formatThaiDate } from "./sanctions";

// Thai messages for Better Auth error codes shown on the auth forms (log in,
// sign up, forgot and reset password).
const messages: Record<string, string> = {
  USER_ALREADY_EXISTS: "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบดูนะ",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบดูนะ",
  INVALID_EMAIL_OR_PASSWORD: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  INVALID_EMAIL: "รูปแบบอีเมลไม่ถูกต้อง",
  PASSWORD_TOO_SHORT: "รหัสผ่านสั้นเกินไป",
  PASSWORD_TOO_LONG: "รหัสผ่านยาวเกินไป",
  // Password reset (ลืมรหัสผ่าน).
  INVALID_TOKEN: "ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่ได้เลย",
  USER_NOT_FOUND: "ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่ได้เลย",
  RESET_PASSWORD_DISABLED: "ตอนนี้ยังตั้งรหัสผ่านใหม่ไม่ได้ ลองใหม่ทีหลังนะ",
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
