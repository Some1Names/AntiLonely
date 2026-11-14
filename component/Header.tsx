import Link from "next/link";
import AccountMenu from "@/component/AccountMenu";
import CreateButton from "@/component/CreateButton";
import Icon from "@/component/Icon";
import NotificationLink from "@/component/NotificationLink";
import type { MyRoom } from "@/types/room";
import { primaryButtonClass } from "@/lib/styles";

// A strip of paper along the top with a stitched (dashed) edge. On phones
// "สร้าง" and "โนติ" collapse to their icons so everything fits on one line.
// The bell only shows for someone signed in.
export default function Header({
  notifications,
  rooms = [],
  alias = "",
}: {
  notifications: number;
  rooms?: MyRoom[];
  alias?: string;
}) {
  return (
    <header className="border-b-2 border-dashed border-edge-strong bg-paper">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center font-display text-xl font-semibold sm:text-2xl"
        >
          Anti
          <span className="bg-[linear-gradient(transparent_60%,var(--color-highlight)_60%)] text-kmutt-orange">
            Lonely
          </span>
          <Icon
            name="heart"
            className="ml-0.5 hidden size-4 -translate-y-2 rotate-12 fill-current text-kmutt-orange group-hover:scale-125 motion-safe:transition-transform sm:block"
          />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <CreateButton
            rooms={rooms}
            alias={alias}
            className={`flex h-9 items-center gap-1 px-2.5 sm:px-3 ${primaryButtonClass}`}
          >
            <Icon name="plus" className="size-4" />
            <span className="sr-only sm:not-sr-only">สร้าง</span>
          </CreateButton>
          <NotificationLink count={notifications} />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
