"use client";

import { useLinkStatus } from "next/link";
import Spinner from "@/component/Spinner";

// Put inside a <Link>: a little spinner sticker that shows on the link's
// corner while the page it opens is still loading. It's always there, only
// faded out, so nothing moves when it shows. The nearest positioned ancestor
// decides which corner (give the link or its card `relative`).
export default function LinkPending({
  className = "-right-2 -top-2",
}: {
  className?: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 flex size-6 items-center justify-center rounded-full border-[1.5px] border-ink bg-white text-ink shadow-sticker motion-safe:transition-opacity ${
        pending ? "opacity-100 motion-safe:delay-100" : "opacity-0"
      } ${className}`}
    >
      <Spinner className="size-3.5" />
    </span>
  );
}
