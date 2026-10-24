"use client";

import { useState } from "react";

type Status = "joined" | "requested" | "none";

// Private rooms need a request instead of joining straight away.
export default function JoinButton({
  isPrivate,
  isMember,
}: {
  isPrivate: boolean;
  isMember: boolean;
}) {
  const [status, setStatus] = useState<Status>(isMember ? "joined" : "none");

  const label = {
    joined: "เข้าร่วมแล้ว",
    requested: "ส่งคำขอแล้ว",
    none: isPrivate ? "ขอเข้าร่วม" : "เข้าร่วม",
  }[status];

  return (
    <button
      type="button"
      aria-pressed={status !== "none"}
      onClick={() =>
        setStatus(
          status !== "none" ? "none" : isPrivate ? "requested" : "joined",
        )
      }
      className={`rounded-md border px-4 py-2 text-sm font-semibold ${
        status === "none"
          ? "border-zinc-800 bg-zinc-800 text-white"
          : "border-zinc-300 bg-white"
      }`}
    >
      {label}
    </button>
  );
}
