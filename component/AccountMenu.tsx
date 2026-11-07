"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

const avatarClass =
  "flex size-9 items-center justify-center rounded-full border-2 border-kmutt-yellow bg-peach font-semibold text-ink";

// The avatar at the right of the header. Logged out, it's a log-in link;
// logged in, it opens a small menu with the person's name and log out.
export default function AccountMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on a click outside the menu or on Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (isPending) return <span aria-hidden="true" className={avatarClass} />;

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex h-9 items-center rounded-md border border-edge-strong bg-white px-3 text-sm font-semibold hover:bg-cream"
      >
        เข้าสู่ระบบ
      </Link>
    );
  }

  const name = session.user.name;

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    setOpen(false);
    setSigningOut(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={`บัญชีของ ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={avatarClass}
      >
        {name.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-edge bg-white py-1 text-sm shadow-paper"
        >
          <p className="truncate px-3 py-2 font-semibold">{name}</p>
          <div className="my-1 h-px bg-edge" />
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 hover:bg-butter"
          >
            โปรไฟล์
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className="block w-full px-3 py-2 text-left hover:bg-butter disabled:opacity-60"
          >
            {signingOut ? "กำลังออก…" : "ออกจากระบบ"}
          </button>
        </div>
      )}
    </div>
  );
}
