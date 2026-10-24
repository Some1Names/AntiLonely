"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shown by the intercepted routes in app/@auth. Closing goes back in history,
// which drops the modal and returns to the page underneath.
export default function Modal({
  labelledBy,
  children,
}: {
  labelledBy: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  // While open: focus starts inside the dialog, Tab stays inside it and the
  // page behind can't scroll. The cleanup also runs when Next hides this
  // modal on switching to the other auth form, so nothing leaks between them.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    (dialog.querySelector<HTMLElement>("input, select, textarea") ?? dialog).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        router.back();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const items = [...dialog.querySelectorAll<HTMLElement>(focusable)];
      const first = items[0];
      const last = items[items.length - 1];
      const outside = !dialog.contains(document.activeElement);
      if (event.shiftKey && (outside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (outside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previousFocus?.focus();
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) router.back();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="relative w-full max-w-sm outline-none"
      >
        <button
          type="button"
          aria-label="ปิด"
          onClick={() => router.back()}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-md text-xl text-ink-soft hover:bg-butter"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
