"use client";

import { useRouter } from "next/navigation";
import { ViewTransition, useEffect, useLayoutEffect, useRef } from "react";
import Icon from "@/component/Icon";

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Set while an auth modal is being hidden. A modal shown in the same update is
// a switch between login and signup, which morphs (see the ViewTransition
// below), so it skips the drop-in.
let hidingModal = false;

// ×, Escape and clicking outside lift the sheet out first, then go back.
// The browser's own Back closes it instantly; that can't be delayed.
function closeWithLift(backdrop: HTMLElement | null, back: () => void) {
  if (!backdrop || backdrop.dataset.modal === "leave") return;
  backdrop.dataset.modal = "leave";
  // With reduced motion there's nothing to wait for, so this goes back at once.
  const lift = backdrop.getAnimations({ subtree: true }).map((a) => a.finished);
  Promise.allSettled(lift).then(() => back());
}

// The wide sheet has tabs that change its height, so it sits a fixed
// distance from the top instead of re-centering under the pointer.
const widths = { sm: "max-w-sm my-auto", md: "max-w-xl mt-[6vh] mb-auto" };

// Shown by the intercepted routes in app/@auth, where closing goes back in
// history, which drops the modal and returns to the page underneath. Modals
// opened from page state (create, report) pass onClose instead.
export default function Modal({
  labelledBy,
  onClose,
  size = "sm",
  sheetName = "auth-sheet",
  children,
}: {
  labelledBy: string;
  onClose?: () => void;
  size?: keyof typeof widths;
  sheetName?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Next hides the modal on close instead of unmounting it, and shows the
  // same one again on the next open. This runs on every show, before paint,
  // so the CSS entrance starts with the right keyframes each time. data-modal
  // also tints the scrollbar gutter (globals.css) while the modal is shown.
  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    backdrop.dataset.modal = hidingModal ? "switch" : "open";
    return () => {
      backdrop.dataset.modal = "hidden";
      hidingModal = true;
      queueMicrotask(() => {
        hidingModal = false;
      });
    };
  }, []);

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
        closeWithLift(backdropRef.current, () =>
          onCloseRef.current ? onCloseRef.current() : router.back(),
        );
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

  const close = () =>
    closeWithLift(backdropRef.current, () =>
      onClose ? onClose() : router.back(),
    );

  return (
    <div
      ref={backdropRef}
      // A sheet taller than the window scrolls inside the backdrop. Auto
      // margins on the sheet place it without clipping its top the way
      // items-center would.
      className="group/modal fixed inset-0 z-50 flex justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm motion-safe:data-[modal=open]:animate-backdrop-in motion-safe:data-[modal=leave]:animate-backdrop-out"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {/* Login and signup share this name, so switching between them morphs
          one sheet into the other. */}
      <ViewTransition name={sheetName} share="auto" default="none">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className={`relative w-full ${widths[size]} outline-none motion-safe:group-data-[modal=open]/modal:animate-sheet-drop motion-safe:group-data-[modal=leave]/modal:animate-sheet-lift`}
        >
          <button
            type="button"
            aria-label="ปิด"
            onClick={close}
            className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-butter hover:text-ink"
          >
            <Icon name="x" className="size-5" />
          </button>
          {children}
        </div>
      </ViewTransition>
    </div>
  );
}
