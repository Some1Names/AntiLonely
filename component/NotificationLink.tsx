"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import Icon from "@/component/Icon";
import LinkPending from "@/component/LinkPending";
import NotificationBadge from "@/component/NotificationBadge";
import { usePageSignedIn } from "@/component/RoomMembership";

// The header's "โนติ" bell, only for someone signed in. Home already knows
// from the server, so it follows that and switches together with the welcome
// note; other pages ask the session, like the account menu beside it.
export default function NotificationLink({ count }: { count: number }) {
  const fromPage = usePageSignedIn();
  const { data: session, isPending } = authClient.useSession();
  const signedIn = fromPage ?? (isPending ? null : session !== null);

  if (signedIn === false) return null;

  // Until the session is known the bell holds its place without showing, so
  // nothing shifts when it turns up. It goes at the same moment the account
  // menu swaps its placeholder for the log in link. `invisible` also keeps it
  // out of the tab order and away from screen readers.
  const hidden = signedIn === null;

  return (
    <Link
      href="/notifications"
      className={`relative flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-ink bg-butter px-2.5 text-sm font-semibold hover:bg-highlight ${hidden ? "invisible" : ""}`}
    >
      <Icon name="bell" className="size-4" />
      <span className="sr-only sm:not-sr-only">โนติ</span>
      <NotificationBadge count={count} />
      <LinkPending />
    </Link>
  );
}
