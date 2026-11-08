'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { ReactionItem } from '@/types/post-thread';
import {
  INITIAL_PICKER_EMOJIS,
  REMAINING_PICKER_EMOJIS,
} from '@/lib/post-thread';

export interface ReactionBarProps {
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
  const [showAllPickerEmojis, setShowAllPickerEmojis] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPickerOpen(false);
        setShowAllPickerEmojis(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsPickerOpen(false);
        setShowAllPickerEmojis(false);
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
      ? 'h-8 px-3 py-1.5 text-[13px] font-medium leading-[1.4] gap-1'
      : 'h-7 px-2 text-xs font-medium leading-[1.4] gap-1';

  const triggerClasses =
    size === 'md'
      ? 'h-8 px-2.5 py-1 text-[13px] font-medium leading-[1.4] gap-1'
      : 'h-7 px-2 text-xs font-medium leading-[1.4] gap-0.5';

  const iconSize = size === 'md' ? 16 : 14;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center flex-wrap gap-[3px]"
    >
      {reactions.map((item) => (
        <button
          key={item.emoji}
          type="button"
          onClick={() => onToggleReaction(item.emoji)}
          aria-pressed={item.reactedByMe}
          aria-label={`รีแอคชัน ${item.emoji} ${item.count} คน`}
          title={
            item.reactedByMe
              ? 'คุณกดรีแอคชันนี้แล้ว (คลิกเพื่อยกเลิก)'
              : 'คลิกเพื่อกดรีแอคชัน'
          }
          className={`inline-flex items-center justify-center rounded-full border transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 relative after:absolute after:inset-[-6px] after:content-[''] ${pillClasses} ${
            item.reactedByMe
              ? 'border-[#18181b] bg-[#f4f4f5] text-[#18181b] font-medium'
              : 'border-[#e4e4e7] bg-white text-[#18181b] hover:bg-[#f4f4f5]'
          }`}
        >
          <span className="leading-none select-none">
            {item.emoji}
          </span>
          <span className="text-[#a1a1aa] font-normal select-none">·</span>
          <span className="tabular-nums">{item.count}</span>
        </button>
      ))}

      <div className="relative inline-flex">
        <button
          type="button"
          onClick={() => setIsPickerOpen((prev) => !prev)}
          aria-label="เพิ่มรีแอคชัน"
          aria-expanded={isPickerOpen}
          className={`inline-flex items-center justify-center rounded-full border border-[#e4e4e7] bg-white text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b] active:scale-[0.98] transition-all duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 relative after:absolute after:inset-[-6px] after:content-[''] ${triggerClasses}`}
        >
          <svg
            width={iconSize}
            height={iconSize}
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
          <span className="font-sans font-medium text-[13px] leading-none text-[#71717a] select-none">
            +
          </span>
        </button>

        {isPickerOpen && (
          <div
            role="menu"
            aria-label="เลือกอีโมจิรีแอคชัน"
            className="absolute left-0 bottom-[calc(100%+8px)] z-30 flex items-center flex-nowrap w-max gap-1.5 sm:gap-2 rounded-full border border-[#e4e4e7] bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-[calc(100vw-32px)] overflow-x-auto whitespace-nowrap"
          >
            {INITIAL_PICKER_EMOJIS.map((emoji) => {
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
                    setShowAllPickerEmojis(false);
                  }}
                  className={`flex items-center justify-center rounded-full text-lg sm:text-xl p-1 transition-transform hover:scale-125 active:scale-95 cursor-pointer select-none leading-none shrink-0 focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 ${
                    isSelected
                      ? 'bg-[#f4f4f5] ring-1 ring-[#18181b]'
                      : 'hover:bg-[#f4f4f5]'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}

            {!showAllPickerEmojis ? (
              <button
                type="button"
                onClick={() => setShowAllPickerEmojis(true)}
                aria-label="ดูอิโมจิเพิ่มเติม"
                title="ดูอิโมจิเพิ่มเติม"
                className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#e4e4e7] bg-white text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b] active:scale-95 transition-all cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 shrink-0 ml-0.5"
              >
                <svg
                  width={iconSize}
                  height={iconSize}
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M8 3.5V12.5M3.5 8H12.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <>
                {REMAINING_PICKER_EMOJIS.map((emoji) => {
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
                        setShowAllPickerEmojis(false);
                      }}
                      className={`flex items-center justify-center rounded-full text-lg sm:text-xl p-1 transition-transform hover:scale-125 active:scale-95 cursor-pointer select-none leading-none shrink-0 focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 ${
                        isSelected
                          ? 'bg-[#f4f4f5] ring-1 ring-[#18181b]'
                          : 'hover:bg-[#f4f4f5]'
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowAllPickerEmojis(false)}
                  aria-label="ย่ออิโมจิ"
                  title="ย่ออิโมจิ"
                  className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#e4e4e7] bg-white text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b] active:scale-95 transition-all cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 shrink-0 ml-0.5"
                >
                  <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3.5 8H12.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReactionBar;
