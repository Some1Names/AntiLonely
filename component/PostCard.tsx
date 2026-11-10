"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactionBar from "@/component/ReactionBar";
import { ReportModal } from "@/component/post-thread/ReportModal";
import { toggleReaction } from "@/lib/post-thread";
import type { ReactionItem } from "@/types/post-thread";

type Props = {
  id?: string | number;
  roomId?: string;
  author?: string;
  room?: string;
  time: string;
  createdAt?: string;
  content: string;
  isOwner?: boolean;
  isEdited?: boolean;
  reactions?: { emoji: string; count: number; reactedByMe?: boolean }[];
  replyCount: number;
  onEditPost?: (newContent: string) => void;
  onDeletePost?: () => void;
  onReportSubmitted?: (message?: string) => void;
};

export default function PostCard({
  id,
  roomId,
  author,
  room,
  time,
  createdAt,
  content,
  isOwner = false,
  isEdited = false,
  reactions: initialReactions = [],
  replyCount,
  onEditPost,
  onDeletePost,
  onReportSubmitted,
}: Props) {
  const [reactions, setReactions] = useState<ReactionItem[]>(() =>
    initialReactions.map((r) => ({
      emoji: r.emoji,
      count: r.count,
      reactedByMe: Boolean(r.reactedByMe),
    }))
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  const isLongContent =
    content.length > 280 || (content.match(/\n/g) || []).length >= 6;

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

  const handleToggleReaction = (emoji: string) => {
    setReactions((prev) => toggleReaction(prev, emoji));
  };

  const handleStartEdit = () => {
    setIsMenuOpen(false);
    setEditDraft(content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDraft("");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    if (trimmed === content.trim()) {
      handleCancelEdit();
      return;
    }
    onEditPost?.(trimmed);
    setIsEditing(false);
    setEditDraft("");
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDeletePost?.();
  };

  const handleCopyLink = async () => {
    setIsMenuOpen(false);
    if (typeof window !== "undefined" && threadHref && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}${threadHref}`
        );
      } catch {
        // ignore
      }
    }
    onReportSubmitted?.("คัดลอกลิงก์กระทู้เรียบร้อยแล้ว");
  };

  return (
    <article className="w-full rounded-xl border border-[#e4e4e7] bg-white p-4 sm:p-5 flex flex-col gap-3 transition-colors duration-150 hover:border-[#d4d4d8] leading-[1.4]">
      <div ref={headerRef} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {author && (
            <div
              aria-hidden="true"
              className="w-8 h-8 shrink-0 rounded-full bg-[#d4d4d8]"
            />
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              {author && (
                <span className="text-sm font-semibold text-[#18181b] leading-[1.4] truncate">
                  {author}
                </span>
              )}
              {room && (
                <span className="rounded-md bg-[#f4f4f5] px-2 py-0.5 text-xs font-medium text-[#71717a] leading-[1.4]">
                  {room}
                </span>
              )}
            </div>
            {createdAt ? (
              <time
                dateTime={createdAt}
                suppressHydrationWarning
                className="text-xs font-normal text-[#71717a] leading-[1.4]"
              >
                {time}
                {isEdited ? " (แก้ไขแล้ว)" : ""}
              </time>
            ) : (
              <span className="text-xs font-normal text-[#71717a] leading-[1.4]">
                {time}
                {isEdited ? " (แก้ไขแล้ว)" : ""}
              </span>
            )}
          </div>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="ตัวเลือกเพิ่มเติม"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="p-1 rounded-md text-sm font-bold text-[#a1a1aa] hover:text-[#18181b] transition-colors cursor-pointer select-none leading-none tracking-wider focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 relative flex items-center justify-center min-w-[28px] min-h-[28px] after:absolute after:w-[44px] after:h-[44px] after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
          >
            •••
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              aria-label="ตัวเลือกกระทู้"
              className="absolute right-0 top-[calc(100%+4px)] z-20 flex w-44 flex-col rounded-[10px] border border-[#e4e4e7] bg-white p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            >
              {threadHref && (
                <>
                  <Link
                    href={threadHref}
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-[#18181b] hover:bg-[#f4f4f5] transition-colors"
                  >
                    เปิดดูกระทู้
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleCopyLink}
                    className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-[#18181b] hover:bg-[#f4f4f5] transition-colors cursor-pointer"
                  >
                    คัดลอกลิงก์กระทู้
                  </button>
                </>
              )}
              {isOwner ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleStartEdit}
                    className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-[#18181b] hover:bg-[#f4f4f5] transition-colors cursor-pointer"
                  >
                    แก้ไขกระทู้
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleDelete}
                    className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-[#dc2626] hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    ลบกระทู้
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsReporting(true);
                  }}
                  className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-[#dc2626] hover:bg-red-50 transition-colors cursor-pointer"
                >
                  รายงานกระทู้
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-2">
            <input
              type="text"
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleCancelEdit();
                }
              }}
              autoFocus
              aria-label="แก้ไขกระทู้"
              className="w-full h-[42px] rounded-lg border border-[#e4e4e7] bg-white px-3.5 py-2.5 text-sm text-[#18181b] focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 leading-[1.4]"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!editDraft.trim()}
                className="h-8 px-3 rounded-lg bg-[#18181b] text-white text-xs font-semibold hover:bg-[#27272a] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="h-8 px-3 rounded-lg border border-[#e4e4e7] bg-white text-xs font-medium text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        ) : (
          <>
            {threadHref ? (
              <Link
                href={threadHref}
                className={`block text-[15px] font-normal text-[#18181b] leading-[1.4] whitespace-pre-wrap [overflow-wrap:anywhere] break-words hover:text-[#71717a] transition-colors ${
                  !isExpanded && isLongContent ? "line-clamp-6" : ""
                }`}
              >
                {content}
              </Link>
            ) : (
              <p
                className={`text-[15px] font-normal text-[#18181b] leading-[1.4] whitespace-pre-wrap [overflow-wrap:anywhere] break-words ${
                  !isExpanded && isLongContent ? "line-clamp-6" : ""
                }`}
              >
                {content}
              </p>
            )}

            {isLongContent && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="mt-1 text-xs font-medium text-[#71717a] hover:text-[#18181b] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
              >
                {isExpanded ? "ย่อกลับ" : "ดูเพิ่มเติม"}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-x-2 gap-y-3 flex-wrap w-full pt-1">
        <ReactionBar
          reactions={reactions}
          onToggleReaction={handleToggleReaction}
          size="md"
          avoidRef={headerRef}
          pickerId={id !== undefined ? `post-${id}` : undefined}
        />

        {threadHref ? (
          <Link
            href={threadHref}
            className="inline-flex h-8 max-w-full items-center rounded-full border border-[#e4e4e7] bg-white px-3 py-1.5 text-[13px] font-medium leading-[1.4] text-[#18181b] hover:bg-[#f4f4f5] transition-colors relative after:absolute after:inset-y-[-6px] after:inset-x-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 ml-auto truncate"
          >
            {replyCount > 0 ? (
              `ตอบกลับ ${replyCount}`
            ) : (
              <>
                <span className="hidden min-[381px]:inline">ยังไม่มีใครตอบ · มาเป็นคนแรกกัน</span>
                <span className="inline min-[381px]:hidden">มาเป็นคนแรก</span>
              </>
            )}
          </Link>
        ) : (
          <button
            type="button"
            className="inline-flex h-8 max-w-full items-center rounded-full border border-[#e4e4e7] bg-white px-3 py-1.5 text-[13px] font-medium leading-[1.4] text-[#18181b] hover:bg-[#f4f4f5] transition-colors relative after:absolute after:inset-y-[-6px] after:inset-x-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 ml-auto truncate"
          >
            {replyCount > 0 ? (
              `ตอบกลับ ${replyCount}`
            ) : (
              <>
                <span className="hidden min-[381px]:inline">ยังไม่มีใครตอบ · มาเป็นคนแรกกัน</span>
                <span className="inline min-[381px]:hidden">มาเป็นคนแรก</span>
              </>
            )}
          </button>
        )}
      </div>

      <ReportModal
        isOpen={isReporting}
        targetType="post"
        onClose={() => setIsReporting(false)}
        onSubmit={() => {
          setIsReporting(false);
          onReportSubmitted?.("ส่งรายงานกระทู้ให้ทีมงานตรวจสอบเรียบร้อยแล้ว");
        }}
      />
    </article>
  );
}
