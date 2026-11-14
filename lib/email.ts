// Outgoing email. All sending goes through sendEmail, so switching provider
// means changing that one function. No imports here so the message builders
// can be unit-tested with node --test.
//
// Real mail is sent through Resend (https://resend.com) when RESEND_API_KEY
// and EMAIL_FROM are set (see .env.example). Without them nothing is sent:
// in development the message, link included, is printed to the server
// console instead; in production only an error is logged, never the link.

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[email] Not sent ("${message.subject}"): set RESEND_API_KEY and EMAIL_FROM to send mail.`,
      );
      return;
    }
    console.log(
      [
        "",
        "[email] No mail provider set up; this would have been sent:",
        `  To:      ${message.to}`,
        `  Subject: ${message.subject}`,
        ...message.text.split("\n").map((line) => `  | ${line}`),
        "",
      ].join("\n"),
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend refused the email: ${response.status} ${await response.text()}`);
  }
}

// How long a reset link works, in seconds (Better Auth's
// resetPasswordTokenExpiresIn). The email and the form both say so.
export const RESET_LINK_LIFETIME_SECONDS = 60 * 60;

export function resetPasswordEmail(to: string, url: string): EmailMessage {
  return {
    to,
    subject: "ตั้งรหัสผ่านใหม่ของ AntiLonely",
    text: [
      "สวัสดี!",
      "",
      "มีคนขอตั้งรหัสผ่านใหม่ให้บัญชี AntiLonely ที่ใช้อีเมลนี้",
      "ถ้าเป็นคุณ กดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ได้เลย:",
      "",
      url,
      "",
      `ลิงก์นี้ใช้ได้ครั้งเดียว ภายใน ${RESET_LINK_LIFETIME_SECONDS / 60} นาที`,
      "ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้เหมือนเดิม",
      "",
      "AntiLonely",
    ].join("\n"),
  };
}

// For an account that only signs in with Google: it has no password to
// reset, so the email says how to get in instead of carrying a link.
export function googleOnlyAccountEmail(to: string, loginUrl: string): EmailMessage {
  return {
    to,
    subject: "เข้าสู่ระบบ AntiLonely ด้วย Google",
    text: [
      "สวัสดี!",
      "",
      "มีคนขอตั้งรหัสผ่านใหม่ให้บัญชี AntiLonely ที่ใช้อีเมลนี้",
      "แต่บัญชีนี้สมัครด้วย Google จึงไม่มีรหัสผ่านให้ตั้งใหม่",
      `เข้าสู่ระบบได้ที่ ${loginUrl} แล้วกดปุ่ม “เข้าสู่ระบบด้วย Google”`,
      "",
      "ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร",
      "",
      "AntiLonely",
    ].join("\n"),
  };
}
