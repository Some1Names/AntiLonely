import Icon from "@/component/Icon";
import { maskEmail } from "@/lib/sanctions";
import { alertClass, avatarClass, choiceClass } from "@/lib/styles";

// Shared pieces of the suspend and ban dialogs (admin panel). They sit on
// Paper in the app's scrapbook look; a ban is the one place red means danger.

export type SanctionTarget = { id: string; username: string; email: string };

const tones = {
  warning: {
    icon: "bg-kmutt-yellow text-ink",
    badge: "border-butter-edge bg-butter text-ink",
    subtitle: "text-ink-soft",
  },
  danger: {
    icon: "bg-red-100 text-red-700",
    badge: "border-red-300 bg-red-50 text-red-700",
    subtitle: "text-red-700",
  },
};
export type SanctionTone = keyof typeof tones;

export const checkboxClass = "size-5 shrink-0 accent-kmutt-orange-dark";

// One of the suspension lengths (7/14/30 days, custom) as a choice that turns
// into a butter sticker once picked. Its radio is visually hidden.
export const presetClass = `${choiceClass} items-center justify-center`;

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
    <div className="flex items-center gap-3 pr-10">
      <span
        aria-hidden="true"
        className={`flex size-11 shrink-0 -rotate-6 items-center justify-center rounded-xl border-[1.5px] border-ink shadow-sticker ${tones[tone].icon}`}
      >
        <Icon name="alert" className="size-6" />
      </span>
      <div>
        <h2 id={titleId} className="font-display text-2xl font-semibold">
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
    <div className="mt-6 flex items-center gap-3 rounded-lg border-[1.5px] border-dashed border-edge-strong bg-cream px-4 py-3">
      <span aria-hidden="true" className={avatarClass}>
        <Icon name="user" className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{user.username}</p>
        <p className="truncate text-sm text-ink-soft">{maskEmail(user.email)}</p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-3 text-xs font-semibold leading-6 ${tones[tone].badge}`}
      >
        {badge}
      </span>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className={alertClass}>
      {message}
    </p>
  );
}
