"use client";

import { useState } from "react";
import CreateModal, { type CreateTab } from "@/component/CreateModal";
import type { MyRoom } from "@/lib/mock";

// Opens the create modal on a given tab. Lets server components (Header,
// Sidebar) place the button without becoming client components.
export default function CreateButton({
  rooms,
  alias,
  tab = "post",
  className,
  children,
}: {
  rooms: MyRoom[];
  alias: string;
  tab?: CreateTab;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      {open && (
        <CreateModal
          rooms={rooms}
          alias={alias}
          initialTab={tab}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
