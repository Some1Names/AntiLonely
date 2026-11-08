"use client";

import { useState } from "react";
import Icon from "@/component/Icon";
import { primaryButtonClass } from "@/lib/styles";

type Status = "joined" | "requested" | "none";

// Private rooms need a request instead of joining straight away. Once
// pressed, the sticker stays pressed in and turns peach, with a check
// (joined) or a clock (waiting for the request).
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
      className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 ${
        status === "none"
          ? primaryButtonClass
          : "translate-0.5 rounded-lg border-[1.5px] border-peach-edge bg-peach text-sm font-semibold text-kmutt-orange-dark hover:bg-peach-edge/50"
      }`}
    >
      {status === "joined" && <Icon name="check" className="size-4" />}
      {status === "requested" && <Icon name="clock" className="size-4" />}
      {label}
    </button>
  );
}
