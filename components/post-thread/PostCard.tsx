'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { PostThread } from '@/types/post-thread';
import { formatRelativeTimeThai } from '@/lib/post-thread';
import { ReactionBar } from '@/components/post-thread/ReactionBar';

interface PostCardProps {
  thread: PostThread;
  referenceTime: number;
  isMuted: boolean;
  onToggleReaction: (emoji: string) => void;
  onReplyClick: () => void;
  onShareClick: () => void;
  onCopyLinkClick: () => void;
  onToggleMuteClick: () => void;
  onReportClick: () => void;
}

export function PostCard({
  thread,
  referenceTime,
  isMuted,
  onToggleReaction,
  onReplyClick,
  onShareClick,
  onCopyLinkClick,
  onToggleMuteClick,
  onReportClick,
}: PostCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <article className="relative bg-white border border-[#e4e4e7] rounded-xl p-6">
      {/* Author Header & Overflow Menu */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden="true"
            className="w-11 h-11 rounded-full bg-[#d4d4d8] shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-[#18181b] truncate">
              {thread.author.name}
            </div>
            <div className="text-[13px] text-[#71717a] truncate">
              ใน{thread.boardName} ·{' '}
              {formatRelativeTimeThai(thread.createdAt, referenceTime)}
            </div>
          </div>
        </div>

        <div ref={menuContainerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="ตัวเลือกเพิ่มเติม"
            aria-expanded={isMenuOpen}
            className="px-2 py-1 rounded-md text-[#71717a] hover:text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer select-none leading-none tracking-wider"
          >
            •••
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              aria-label="ตัวเลือกกระทู้"
              className="absolute right-0 top-[calc(100%+6px)] z-20 w-[180px] rounded-[10px] border border-[#e4e4e7] bg-white p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onCopyLinkClick();
                }}
                className="w-full text-left px-2.5 py-2 rounded-md text-sm text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                คัดลอกลิงก์
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onToggleMuteClick();
                }}
                className="w-full text-left px-2.5 py-2 rounded-md text-sm text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {isMuted ? 'เปิดแจ้งเตือนกระทู้นี้' : 'ปิดแจ้งเตือนกระทู้นี้'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onReportClick();
                }}
                className="w-full text-left px-2.5 py-2 rounded-md text-sm text-[#dc2626] hover:bg-red-50 transition-colors cursor-pointer"
              >
                รายงานกระทู้
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Body */}
      <div className="my-4 text-base text-[#18181b] leading-relaxed whitespace-pre-wrap break-words">
        {thread.content}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <ReactionBar
          reactions={thread.reactions}
          onToggleReaction={onToggleReaction}
          size="md"
        />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReplyClick}
            className="h-8 px-3 rounded-full border border-[#e4e4e7] bg-white text-[13px] font-medium text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer select-none"
          >
            ตอบกลับ
          </button>
          <button
            type="button"
            onClick={onShareClick}
            className="h-8 px-3 rounded-full border border-[#e4e4e7] bg-white text-[13px] font-medium text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer select-none"
          >
            แชร์
          </button>
        </div>
      </div>
    </article>
  );
}

