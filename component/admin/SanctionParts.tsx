import { maskEmail } from "@/lib/sanctions";

// Shared pieces of the suspend and ban dialogs (admin panel). The admin panel
// uses a plain black-and-white look instead of the app's notebook style.

export type SanctionTarget = { id: string; username: string; email: string };

const tones = {
  warning: { icon: "bg-amber-100", badge: "bg-amber-100 text-amber-700", subtitle: "text-neutral-500" },
  danger: { icon: "bg-red-100", badge: "bg-red-100 text-red-700", subtitle: "text-red-600" },
};
export type SanctionTone = keyof typeof tones;

export const sectionLabelClass = "text-sm font-semibold text-neutral-900";
export const fieldClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50 disabled:text-neutral-400";
export const checkboxClass = "size-5 shrink-0 rounded accent-neutral-900";
export const cancelButtonClass =
  "rounded-lg py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-50";
export const confirmButtonClass =
  "rounded-lg py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40";

export function SanctionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">{children}</div>
  );
}

export function SanctionHeader({
  titleId,
  title,
  subtitle,
  tone,
}: {
  titleId: string;
  title: string;
  subtitle: string;
  tone: SanctionTone;
}) {
  return (
    <div className="flex items-center gap-3 pr-8">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tones[tone].icon}`}>
        <WarningIcon />
      </span>
      <div>
        <h2 id={titleId} className="text-xl font-bold text-neutral-900">
          {title}
        </h2>
        <p className={`text-sm ${tones[tone].subtitle}`}>{subtitle}</p>
      </div>
    </div>
  );
}

export function SanctionUserCard({
  user,
  badge,
  tone,
}: {
  user: SanctionTarget;
  badge: string;
  tone: SanctionTone;
}) {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-xl bg-neutral-100 px-4 py-4">
      <span aria-hidden="true" className="size-10 shrink-0 rounded-full bg-neutral-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-neutral-900">{user.username}</p>
        <p className="truncate text-sm text-neutral-500">{maskEmail(user.email)}</p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone].badge}`}>
        {badge}
      </span>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-red-600">
      {message}
    </p>
  );
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
