import Link from "next/link";
import Icon from "@/component/Icon";
import Paper from "@/component/Paper";
import { highlightClass } from "@/lib/styles";

// A little stack of paper taped onto the notebook background, with the
// title highlighted.
export default function AuthCard({
  titleId,
  title,
  subtitle,
  children,
}: {
  titleId: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Paper className="w-full max-w-sm">
      <p className="flex items-center font-display text-lg font-semibold">
        Anti<span className="text-kmutt-orange">Lonely</span>
        <Icon
          name="heart"
          className="ml-0.5 size-3.5 -translate-y-1.5 rotate-12 fill-current text-kmutt-orange"
        />
      </p>
      <h1 id={titleId} className="mt-4 font-display text-[1.75rem] leading-tight font-semibold">
        <span className={highlightClass}>{title}</span>
      </h1>
      <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </Paper>
  );
}

// Switches between log in and sign up. Inside the modal, replace history so
// one Back or close returns to the page underneath. On the full page, do a
// normal load: a client-side Link would be intercepted and open a modal.
export function AuthLink({
  href,
  inModal,
  children,
}: {
  href: string;
  inModal: boolean;
  children: React.ReactNode;
}) {
  const className =
    "font-semibold text-kmutt-orange-dark underline-offset-4 hover:underline";
  return inModal ? (
    <Link href={href} replace className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
