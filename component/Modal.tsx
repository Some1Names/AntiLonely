"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") router.back();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) router.back();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative w-full max-w-sm"
      >
        <button
          type="button"
          aria-label="ปิด"
          onClick={() => router.back()}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md text-xl text-zinc-500 hover:bg-zinc-100"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
