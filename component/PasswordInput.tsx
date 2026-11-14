"use client";

import { useLayoutEffect, useState, type ComponentProps } from "react";

export default function PasswordInput({
  invalid = false,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);

  // Next hides a closed form instead of unmounting it; the next open starts
  // with the password covered again.
  useLayoutEffect(() => {
    return () => setVisible(false);
  }, []);

  return (
    <div
      className={`flex items-center rounded-lg border-[1.5px] bg-white focus-within:ring-3 focus-within:ring-kmutt-yellow/40 ${
        invalid
          ? "border-red-500"
          : "border-edge-strong focus-within:border-kmutt-orange"
      }`}
    >
      <input
        {...props}
        type={visible ? "text" : "password"}
        aria-invalid={invalid}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-ink-soft/70"
      />
      <button
        type="button"
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
        className="self-stretch rounded-r-lg px-3 text-sm font-medium text-ink-soft hover:text-kmutt-orange-dark"
      >
        {visible ? "ซ่อน" : "แสดง"}
      </button>
    </div>
  );
}
