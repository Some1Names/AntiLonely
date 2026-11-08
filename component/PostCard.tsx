"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import EmojiPicker from "emoji-picker-react";
import ReportModal from "@/component/ReportModal";

type Reaction = { emoji: string; count: number };

type Props = {
  id?: string | number;
  roomId?: string;
  author?: string;
  room?: string;
  time: string;
  content: string;
  reactions?: Reaction[];
  replyCount: number;
};

export default function PostCard({
  id,
  roomId,
  author,
  room,
  time,
  content,
  reactions: initialReactions = [],
  replyCount,
}: Props) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [myReactions, setMyReactions] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const threadHref =
    roomId && id !== undefined ? `/rooms/${roomId}/posts/${id}` : null;

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // กดอิโมจิ: ยังไม่เคยกด = +1, กดแล้ว = -1 (ถ้าเหลือ 0 ปุ่มจะหาย)
  function toggleReaction(emoji: string) {
    const already = myReactions.includes(emoji);
    const exists = reactions.some((r) => r.emoji === emoji);

    if (already) {
      setMyReactions(myReactions.filter((e) => e !== emoji));
      setReactions(
        reactions
          .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1 } : r))
          .filter((r) => r.count > 0)
      );
    } else {
      setMyReactions([...myReactions, emoji]);
      if (exists) {
        setReactions(
          reactions.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count + 1 } : r
          )
        );
      } else {
        setReactions([...reactions, { emoji, count: 1 }]);
      }
    }
  }

  const replyLabel =
    replyCount > 0
      ? `ตอบกลับ ${replyCount}`
      : "ยังไม่มีใครตอบ · มาเป็นคนแรกกัน";

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {author && (
            <div
              aria-hidden="true"
              className="h-10 w-10 shrink-0 rounded-full bg-gray-300"
            />
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              {author && (
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {author}
                </span>
              )}
              {room && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {room}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="ตัวเลือกเพิ่มเติม"
            aria-expanded={isMenuOpen}
            className="rounded-md px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer select-none leading-none tracking-wider"
          >
            •••
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              aria-label="ตัวเลือกกระทู้"
              className="absolute right-0 top-[calc(100%+4px)] z-20 flex w-40 flex-col rounded-lg border border-gray-200 bg-white p-1.5 shadow-md"
            >
              {threadHref && (
                <Link
                  href={threadHref}
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-md px-2.5 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  เปิดดูกระทู้
                </Link>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsReporting(true);
                }}
                className="w-full rounded-md px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                รายงานกระทู้
              </button>
            </div>
          )}
        </div>
      </div>

      {threadHref ? (
        <Link
          href={threadHref}
          className="mb-3 block text-base text-gray-900 hover:text-kmutt-orange-dark transition-colors"
        >
          {content}
        </Link>
      ) : (
        <p className="mb-3 text-base text-gray-900">{content}</p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative flex flex-wrap gap-2">
          {reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => toggleReaction(r.emoji)}
              className={`rounded-full border px-3 py-1 text-sm cursor-pointer transition-colors ${
                myReactions.includes(r.emoji)
                  ? "border-neutral-900 bg-gray-100"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {r.emoji} · {r.count}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            aria-label="เพิ่มรีแอคชัน"
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            ☺ +
          </button>

          {showPicker && (
            <div className="absolute left-0 top-10 z-20">
              <EmojiPicker
                onEmojiClick={(e) => {
                  toggleReaction(e.emoji);
                  setShowPicker(false);
                }}
              />
            </div>
          )}
        </div>

        {threadHref ? (
          <Link
            href={threadHref}
            className="rounded-full border border-gray-200 px-3.5 py-1 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {replyLabel}
          </Link>
        ) : (
          <button
            type="button"
            className="rounded-full border border-gray-200 px-3.5 py-1 text-sm text-gray-700"
          >
            {replyLabel}
          </button>
        )}
      </div>

      {isReporting && (
        <ReportModal
          comment={{
            author: author ?? "นิรนาม",
            roomName: room ?? roomId ?? "ห้องสนทนา",
            text: content,
          }}
          onClose={() => setIsReporting(false)}
        />
      )}
    </article>
  );
}
