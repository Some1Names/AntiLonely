'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { ReactionItem } from '@/types/post-thread';
import { PRESET_REACTION_EMOJIS } from '@/lib/post-thread';

interface ReactionBarProps {
  reactions: ReactionItem[];
  onToggleReaction: (emoji: string) => void;
  size?: 'md' | 'sm';
}

export function ReactionBar({
  reactions,
  onToggleReaction,
  size = 'md',
}: ReactionBarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPickerOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsPickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPickerOpen]);

  const pillClasses =
    size === 'md'
      ? 'h-8 px-3 text-[13px] gap-1'
      : 'h-6 px-2 text-xs gap-1';

  const triggerClasses =
    size === 'md'
      ? 'h-8 px-2.5 text-[13px] gap-1'
      : 'h-6 px-2 text-xs gap-0.5';

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center flex-wrap gap-1.5"
    >
      {reactions.map((item) => (
        <button
          key={item.emoji}
          type="button"
          onClick={() => onToggleReaction(item.emoji)}
          aria-pressed={item.reactedByMe}
          title={
            item.reactedByMe
              ? 'คุณกดรีแอคชันนี้แล้ว (คลิกเพื่อยกเลิก)'
              : 'คลิกเพื่อกดรีแอคชัน'
          }
          className={`inline-flex items-center justify-center rounded-full border transition-colors cursor-pointer select-none ${pillClasses} ${
            item.reactedByMe
              ? 'border-[#18181b] bg-zinc-100 text-[#18181b] font-semibold shadow-[inset_0_0_0_0.5px_#18181b] hover:bg-zinc-200/80'
              : 'border-[#e4e4e7] bg-white text-[#71717a] hover:border-zinc-300 hover:bg-zinc-100 hover:text-[#18181b] font-medium'
          }`}
        >
          <span>{item.emoji}</span>
          <span className="opacity-70">·</span>
          <span>{item.count}</span>
        </button>
      ))}

      <div className="relative inline-flex">
        <button
          type="button"
          onClick={() => setIsPickerOpen((prev) => !prev)}
          aria-label="เพิ่มรีแอคชัน"
          aria-expanded={isPickerOpen}
          className={`inline-flex items-center justify-center rounded-full border border-[#e4e4e7] bg-white text-[#71717a] hover:text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer select-none ${triggerClasses}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <circle cx="5.8" cy="6.6" r="0.9" fill="currentColor" />
            <circle cx="10.2" cy="6.6" r="0.9" fill="currentColor" />
            <path
              d="M5.3 9.6C5.9 10.6 6.85 11.1 8 11.1C9.15 11.1 10.1 10.6 10.7 9.6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="leading-none font-medium">+</span>
        </button>

        {isPickerOpen && (
          <div
            role="menu"
            aria-label="เลือกอีโมจิรีแอคชัน"
            className="absolute left-0 bottom-[calc(100%+6px)] z-30 flex items-center gap-1 rounded-full border border-[#e4e4e7] bg-white px-2 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            {PRESET_REACTION_EMOJIS.map((emoji) => {
              const isSelected = reactions.some(
                (r) => r.emoji === emoji && r.reactedByMe
              );
              return (
                <button
                  key={emoji}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={isSelected}
                  onClick={() => {
                    onToggleReaction(emoji);
                    setIsPickerOpen(false);
                  }}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-base transition-transform hover:scale-110 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-200 ring-1 ring-[#18181b]'
                      : 'hover:bg-zinc-100'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
