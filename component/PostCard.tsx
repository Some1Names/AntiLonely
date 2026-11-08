"use client";

import { useState } from "react";
import EmojiPicker from "emoji-picker-react";

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

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-3">
        {author && <div className="h-9 w-9 rounded-full bg-gray-300" />}
        <div className="flex items-center gap-2">
          {author && <span className="text-sm font-semibold">{author}</span>}
          {room && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {room}
            </span>
          )}
          <span className="text-xs text-gray-400">{time}</span>
        </div>
      </div>

      <p className="mb-3 text-base">{content}</p>

      <div className="flex items-center justify-between">
        <div className="relative flex flex-wrap gap-2">
          {reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => toggleReaction(r.emoji)}
              className={`rounded-full border px-3 py-1 text-sm ${
                myReactions.includes(r.emoji)
                  ? "border-neutral-900 bg-gray-100"
                  : "border-gray-200"
              }`}
            >
              {r.emoji} · {r.count}
            </button>
          ))}

          <button
            onClick={() => setShowPicker(!showPicker)}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500"
          >
            ☺ +
          </button>

          {showPicker && (
            <div className="absolute left-0 top-10 z-10">
              <EmojiPicker
                onEmojiClick={(e) => {
                  toggleReaction(e.emoji);
                  setShowPicker(false);
                }}
              />
            </div>
          )}
        </div>

        <button className="rounded-full border border-gray-200 px-3 py-1 text-sm">
          {replyCount > 0
            ? `ตอบกลับ ${replyCount}`
            : "ยังไม่มีใครตอบ · มาเป็นคนแรกกัน"}
        </button>
      </div>
    </article>
  );
}