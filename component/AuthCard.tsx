import Link from "next/link";

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500";

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
    <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6">
      <p className="font-semibold">AntiLonely</p>
      <h1 id={titleId} className="mt-4 text-2xl font-semibold">
        {title}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
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
  const className = "font-semibold text-zinc-900";
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
