"use client";

import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import Icon from "@/component/Icon";
import {
  avatarClass,
  indexCardClass,
  stickerToggleClass,
} from "@/lib/styles";

type Reaction = { emoji: string; count: number };

type Props = {
  id?: number;
  author?: string;
  room?: string;
  time: string;
  content: string;
  reactions?: Reaction[];
  replyCount: number;
};

// สีของตัวเลือกอิโมจิให้เข้ากับธีมสมุด (ตัวแปร CSS ของ emoji-picker-react)
const pickerTheme = {
  "--epr-bg-color": "var(--color-paper)",
  "--epr-category-label-bg-color": "var(--color-paper)",
  "--epr-text-color": "var(--color-ink)",
  "--epr-picker-border-color": "var(--color-ink)",
  "--epr-picker-border-radius": "0.75rem",
  "--epr-highlight-color": "var(--color-kmutt-orange-dark)",
  "--epr-category-icon-active-color": "var(--color-kmutt-orange-dark)",
  "--epr-hover-bg-color": "var(--color-butter)",
  "--epr-hover-bg-color-reduced-opacity": "var(--color-butter)",
  "--epr-focus-bg-color": "var(--color-highlight)",
  "--epr-search-input-bg-color": "var(--color-cream)",
  "--epr-search-input-bg-color-active": "white",
  "--epr-search-border-color": "var(--color-edge-strong)",
  "--epr-search-border-color-active": "var(--color-kmutt-orange)",
  "--epr-preview-border-color": "var(--color-edge)",
} as React.CSSProperties;

export default function PostCard({
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

  // การ์ดสีขาวขอบหมึก อิโมจิที่เรากดแล้วจะเป็นสติกเกอร์ที่ถูกกดลงไป
  return (
    <article className={`flex flex-col gap-3 p-5 ${indexCardClass}`}>
      <div className="flex items-center gap-3">
        {author && (
          <span aria-hidden="true" className={avatarClass}>
            {author.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {author && <span className="text-sm font-semibold">{author}</span>}
          {room && (
            <span className="rounded-full border border-butter-edge bg-butter px-2 text-xs leading-5">
              {room}
            </span>
          )}
          <span className="text-xs text-ink-soft">{time}</span>
        </div>
      </div>

      <p className="text-base wrap-anywhere">{content}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] border-dashed border-edge pt-3">
        <div className="relative flex flex-wrap gap-2">
          {reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              aria-pressed={myReactions.includes(r.emoji)}
              onClick={() => toggleReaction(r.emoji)}
              className={`px-3 py-0.5 ${stickerToggleClass}`}
            >
              {r.emoji} · {r.count}
            </button>
          ))}

          <button
            type="button"
            aria-label="เพิ่มรีแอคชัน"
            aria-expanded={showPicker}
            onClick={() => setShowPicker(!showPicker)}
            className={`flex items-center gap-0.5 px-2.5 py-1 text-ink-soft hover:text-ink aria-expanded:translate-0.5 aria-expanded:bg-butter aria-expanded:text-ink aria-expanded:shadow-none ${stickerToggleClass}`}
          >
            <Icon name="smile" className="size-4" />
            <Icon name="plus" className="size-3" />
          </button>

          {showPicker && (
            <div className="absolute left-0 top-full z-10 mt-2 rounded-xl shadow-sticker-lg">
              <EmojiPicker
                style={pickerTheme}
                onEmojiClick={(e) => {
                  toggleReaction(e.emoji);
                  setShowPicker(false);
                }}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-kmutt-orange-dark hover:bg-peach/70"
        >
          <Icon name="message" className="size-4" />
          {replyCount > 0
            ? `ตอบกลับ ${replyCount}`
            : "ยังไม่มีใครตอบ · มาเป็นคนแรกกัน"}
        </button>
      </div>
    </article>
  );
}
