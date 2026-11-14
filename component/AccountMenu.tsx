"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/component/Icon";
import LinkPending from "@/component/LinkPending";
import { authClient } from "@/lib/auth-client";
import { avatarClass, outlineButtonClass } from "@/lib/styles";

const menuItemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-butter disabled:opacity-60";

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
        className={`relative flex h-9 items-center whitespace-nowrap px-2.5 min-[360px]:px-3 ${outlineButtonClass}`}
      >
        {/* On the narrowest phones the label doesn't fit beside the other
            header buttons, so it collapses to the icon like "สร้าง" does. */}
        <Icon name="user" className="size-4 min-[360px]:hidden" />
        <span className="max-[359px]:sr-only">เข้าสู่ระบบ</span>
        <LinkPending />
      </Link>
    );
  }

  const name = session.user.name;
  const isStaff =
    session.user.role === "admin" || session.user.role === "moderator";

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
        className={`${avatarClass} active:translate-0.5 active:shadow-none`}
      >
        {name.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-3 w-52 rounded-xl border-[1.5px] border-ink bg-white p-1.5 text-sm shadow-sticker-lg"
        >
          <p className="truncate px-3 py-2 font-display font-semibold">{name}</p>
          <div className="mx-2 mb-1 border-t-[1.5px] border-dashed border-edge" />
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={menuItemClass}
          >
            <Icon name="user" className="size-4 text-ink-soft" />
            โปรไฟล์
          </Link>
          {isStaff && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={menuItemClass}
            >
              <Icon name="shield" className="size-4 text-ink-soft" />
              แผงควบคุมแอดมิน
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className={menuItemClass}
          >
            <Icon name="logout" className="size-4 text-ink-soft" />
            {signingOut ? "กำลังออก…" : "ออกจากระบบ"}
          </button>
        </div>
      )}
    </div>
  );
}
