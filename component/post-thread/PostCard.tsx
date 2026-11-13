'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { PostThread } from '@/types/post-thread';
import { formatRelativeTimeThai } from '@/lib/post-thread';
import { ReactionBar } from './ReactionBar';
import Icon from '@/component/Icon';
import Tape from '@/component/Tape';
import {
  avatarClass,
  indexCardClass,
  outlineButtonClass,
} from '@/lib/styles';

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
  const headerRef = useRef<HTMLDivElement>(null);

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
    <article className={`relative ${indexCardClass} p-5 pt-6 sm:p-6 sm:pt-7`}>
      <Tape className="left-8 h-6 w-20 -rotate-3 bg-kmutt-yellow/70" />
      {/* Author Header & Overflow Menu */}
      <div ref={headerRef} className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div aria-hidden="true" className={avatarClass}>
            <Icon name="user" className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold truncate">
              {thread.author.name}
            </div>
            <div className="text-[13px] text-ink-soft truncate">
              ใน{thread.boardName} ·{' '}
              <time dateTime={thread.createdAt} suppressHydrationWarning>
                {formatRelativeTimeThai(thread.createdAt, referenceTime)}
              </time>
            </div>
          </div>
        </div>

        <div ref={menuContainerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="ตัวเลือกเพิ่มเติม"
            aria-expanded={isMenuOpen}
            className="px-2 py-1 rounded-md text-ink-soft hover:text-ink hover:bg-butter cursor-pointer select-none leading-none tracking-wider relative flex items-center justify-center min-w-[28px] min-h-[28px] after:absolute after:w-[44px] after:h-[44px] after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
          >
            •••
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              aria-label="ตัวเลือกกระทู้"
              className="absolute right-0 top-[calc(100%+6px)] z-20 w-[180px] rounded-[10px] border-[1.5px] border-ink bg-white p-1.5 shadow-sticker flex flex-col"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onCopyLinkClick();
                }}
                className="w-full text-left px-2.5 py-2 rounded-md text-sm hover:bg-butter cursor-pointer"
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
                className="w-full text-left px-2.5 py-2 rounded-md text-sm hover:bg-butter cursor-pointer"
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
                className="w-full text-left px-2.5 py-2 rounded-md text-sm text-red-700 hover:bg-red-50 cursor-pointer"
              >
                รายงานกระทู้
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Body */}
      <div className="my-4 text-base leading-relaxed whitespace-pre-wrap break-words">
        {thread.content}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-3 pt-1">
        <ReactionBar
          reactions={thread.reactions}
          onToggleReaction={onToggleReaction}
          size="md"
          avoidRef={headerRef}
          pickerId={`thread-${thread.id}`}
        />

        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <button
            type="button"
            onClick={onReplyClick}
            className={`h-8 px-3 ${outlineButtonClass} rounded-full! text-[13px]! cursor-pointer select-none relative after:absolute after:inset-y-[-6px] after:inset-x-0 after:content-['']`}
          >
            ตอบกลับ
          </button>
          <button
            type="button"
            onClick={onShareClick}
            className={`h-8 px-3 ${outlineButtonClass} rounded-full! text-[13px]! cursor-pointer select-none relative after:absolute after:inset-y-[-6px] after:inset-x-0 after:content-['']`}
          >
            แชร์
          </button>
        </div>
      </div>
    </article>
  );
}

