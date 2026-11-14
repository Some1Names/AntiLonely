"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactionBar from "@/component/ReactionBar";
import { ReportModal } from "@/component/post-thread/ReportModal";
import { toggleReaction } from "@/lib/post-thread";
import {
  avatarClass,
  indexCardClass,
  inputClass,
  primaryButtonClass,
  disabledButtonClass,
  secondaryButtonClass,
} from "@/lib/styles";
import type { ReactionItem, ReportReason } from "@/types/post-thread";

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
  onToggleReaction?: (emoji: string) => boolean | void | Promise<boolean | void>;
  onReportPost?: (reason: ReportReason, details: string) => void | Promise<void>;
  onReportSubmitted?: (message?: string) => void;
};

// One shared empty list, so a post without reactions gets the same array on
// every render instead of a new one that looks like a change.
const noReactions: NonNullable<Props["reactions"]> = [];

function toReactionItems(
  reactions: NonNullable<Props["reactions"]>
): ReactionItem[] {
  return reactions.map((r) => ({
    emoji: r.emoji,
    count: r.count,
    reactedByMe: Boolean(r.reactedByMe),
  }));
}

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
  reactions: initialReactions = noReactions,
  replyCount,
  onEditPost,
  onDeletePost,
  onToggleReaction,
  onReportPost,
  onReportSubmitted,
}: Props) {
  const reactionSig = initialReactions
    .map((r) => `${r.emoji}:${r.count}:${Boolean(r.reactedByMe)}`)
    .join("|");
  const [prevReactionSig, setPrevReactionSig] = useState(reactionSig);
  const [reactions, setReactions] = useState<ReactionItem[]>(() =>
    toReactionItems(initialReactions)
  );

  if (reactionSig !== prevReactionSig) {
    setPrevReactionSig(reactionSig);
    setReactions(toReactionItems(initialReactions));
  }
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
    if (onToggleReaction) {
      return onToggleReaction(emoji);
    }
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
    <article
      className={`flex w-full flex-col gap-3 p-4 leading-[1.4] sm:p-5 ${indexCardClass}`}
    >
      <div ref={headerRef} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {author && (
            <span aria-hidden="true" className={avatarClass}>
              {author.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              {author && (
                <span className="truncate text-sm font-semibold leading-[1.4]">
                  {author}
                </span>
              )}
              {room && (
                <span className="rounded-full border border-butter-edge bg-butter px-2 py-0.5 text-xs font-medium leading-[1.4]">
                  {room}
                </span>
              )}
            </div>
            {createdAt ? (
              <time
                dateTime={createdAt}
                suppressHydrationWarning
                className="text-xs font-normal leading-[1.4] text-ink-soft"
              >
                {time}
                {isEdited ? " (แก้ไขแล้ว)" : ""}
              </time>
            ) : (
              <span className="text-xs font-normal leading-[1.4] text-ink-soft">
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
            className="relative flex min-h-[28px] min-w-[28px] cursor-pointer select-none items-center justify-center rounded-md p-1 text-sm font-bold leading-none tracking-wider text-ink-soft hover:bg-butter hover:text-ink motion-safe:transition-colors after:absolute after:w-[44px] after:h-[44px] after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
          >
            •••
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              aria-label="ตัวเลือกกระทู้"
              className="absolute right-0 top-[calc(100%+4px)] z-20 flex w-44 flex-col rounded-xl border-[1.5px] border-ink bg-white p-1.5 shadow-sticker"
            >
              {threadHref && (
                <>
                  <Link
                    href={threadHref}
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-ink hover:bg-butter motion-safe:transition-colors"
                  >
                    เปิดดูกระทู้
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleCopyLink}
                    className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-ink hover:bg-butter motion-safe:transition-colors cursor-pointer"
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
                    className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-ink hover:bg-butter motion-safe:transition-colors cursor-pointer"
                  >
                    แก้ไขกระทู้
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleDelete}
                    className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-red-700 hover:bg-red-50 motion-safe:transition-colors cursor-pointer"
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
                  className="w-full rounded-md px-2.5 py-2 text-left text-xs sm:text-[13px] font-medium text-red-700 hover:bg-red-50 motion-safe:transition-colors cursor-pointer"
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
              className={`h-[42px] leading-[1.4] ${inputClass}`}
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!editDraft.trim()}
                className={`h-8 cursor-pointer px-3 text-xs ${primaryButtonClass} ${disabledButtonClass}`}
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`h-8 cursor-pointer px-3 text-xs ${secondaryButtonClass}`}
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
                className={`block text-[15px] font-normal leading-[1.4] text-ink whitespace-pre-wrap [overflow-wrap:anywhere] break-words hover:text-ink-soft motion-safe:transition-colors ${
                  !isExpanded && isLongContent ? "line-clamp-6" : ""
                }`}
              >
                {content}
              </Link>
            ) : (
              <p
                className={`text-[15px] font-normal leading-[1.4] text-ink whitespace-pre-wrap [overflow-wrap:anywhere] break-words ${
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
                className="mt-1 cursor-pointer text-xs font-semibold text-kmutt-orange-dark underline-offset-4 hover:underline"
              >
                {isExpanded ? "ย่อกลับ" : "ดูเพิ่มเติม"}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-3 border-t-[1.5px] border-dashed border-edge pt-3">
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
            className="relative ml-auto inline-flex h-8 max-w-full items-center truncate rounded-full px-3 py-1.5 text-[13px] font-semibold leading-[1.4] text-kmutt-orange-dark hover:bg-peach/70 motion-safe:transition-colors after:absolute after:inset-x-0 after:inset-y-[-6px] after:content-['']"
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
            className="relative ml-auto inline-flex h-8 max-w-full items-center truncate rounded-full px-3 py-1.5 text-[13px] font-semibold leading-[1.4] text-kmutt-orange-dark hover:bg-peach/70 motion-safe:transition-colors after:absolute after:inset-x-0 after:inset-y-[-6px] after:content-['']"
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
        onSubmit={(reason, details) => {
          setIsReporting(false);
          if (onReportPost) {
            void onReportPost(reason, details);
          } else {
            onReportSubmitted?.("ส่งรายงานกระทู้ให้ทีมงานตรวจสอบเรียบร้อยแล้ว");
          }
        }}
      />
    </article>
  );
}
