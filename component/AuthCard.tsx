import Link from "next/link";
import Tape from "@/component/Tape";

// A sheet of paper taped onto the notebook background.
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
    <div className="relative w-full max-w-sm rounded-xs border border-edge bg-white p-6 shadow-paper">
      <Tape />
      <p className="font-display text-lg font-semibold">
        Anti<span className="text-kmutt-orange">Lonely</span>
      </p>
      <h1 id={titleId} className="mt-4 font-display text-2xl font-semibold">
        {title}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
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
