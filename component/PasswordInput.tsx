"use client";

import { useState, type ComponentProps } from "react";

export default function PasswordInput({
  invalid = false,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`flex items-center rounded-md border bg-white focus-within:ring-3 focus-within:ring-kmutt-yellow/40 ${
        invalid
          ? "border-red-500"
          : "border-edge-strong focus-within:border-kmutt-orange"
      }`}
    >
      <input
        {...props}
        type={visible ? "text" : "password"}
        aria-invalid={invalid}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
      />
      <button
        type="button"
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
        className="self-stretch px-3 text-sm text-ink-soft hover:text-kmutt-orange-dark"
      >
        {visible ? "ซ่อน" : "แสดง"}
      </button>
    </div>
  );
}
