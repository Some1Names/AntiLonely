"use client";

import { useState, type ComponentProps } from "react";

export default function PasswordInput({
  invalid = false,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`flex items-center rounded-md border bg-white focus-within:border-zinc-500 ${
        invalid ? "border-red-500" : "border-zinc-300"
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
        className="self-stretch px-3 text-sm text-zinc-500"
      >
        {visible ? "ซ่อน" : "แสดง"}
      </button>
    </div>
  );
}
