// Pure helpers for suspending and banning users (admin panel). No database or
// Next imports here, so they can be unit-tested with node --test.

export type DurationUnit = 'day' | 'week' | 'month';

export const DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
  day: 'วัน',
  week: 'สัปดาห์',
  month: 'เดือน',
};

// Quick choices on the suspend dialog.
export const SUSPENSION_PRESET_DAYS = [7, 14, 30] as const;

// A suspension longer than this should be a ban instead.
export const MAX_SUSPENSION_DAYS = 365;

export const BAN_CONFIRM_WORD = 'BAN';

const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_ZONE = 'Asia/Bangkok';

export function addDuration(start: Date, amount: number, unit: DurationUnit): Date {
  const end = new Date(start);
  if (unit === 'month') end.setMonth(end.getMonth() + amount);
  else end.setTime(end.getTime() + amount * (unit === 'week' ? 7 : 1) * DAY_MS);
  return end;
}

// "22 ธ.ค. 2569": Thai short month and Buddhist year, in Bangkok time.
export function formatThaiDate(date: Date): string {
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date);
}

// An <input type="date"> value ("2026-12-22") as midnight that day in Bangkok,
// which is when the user gets access back.
export function dateInputToEnd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "2026-12-22" for an <input type="date"> min/max, in Bangkok time.
export function toDateInputValue(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date);
}

export function suspensionEndsWithinLimit(end: Date, now: Date = new Date()): boolean {
  return end.getTime() > now.getTime() && end.getTime() <= now.getTime() + MAX_SUSPENSION_DAYS * DAY_MS;
}

// "claire@outlook.com" -> "cl***@outlook.com", so moderators can tell
// accounts apart without seeing the whole address.
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  return `${email.slice(0, Math.min(2, at))}***${email.slice(at)}`;
}

export function isBanConfirmed(text: string): boolean {
  return text.trim().toUpperCase() === BAN_CONFIRM_WORD;
}

export function isSanctionActive(
  sanction: { startAt: Date; endAt: Date | null; liftedAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (sanction.liftedAt) return false;
  if (sanction.startAt.getTime() > now.getTime()) return false;
  return sanction.endAt === null || sanction.endAt.getTime() > now.getTime();
}
