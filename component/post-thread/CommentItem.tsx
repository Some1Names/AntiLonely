'use client';

import React, { useState, useEffect } from 'react';
import type { ThreadComment } from '@/types/post-thread';
import { formatRelativeTimeThai } from '@/lib/post-thread';
import { ReactionBar } from './ReactionBar';
import { ReplyComposer } from './ReplyComposer';

interface CommentItemProps {
  comment: ThreadComment;
  referenceTime: number;
  currentUserId: string;
  currentUserName: string;
  isExpanded: boolean;
  isReplying: boolean;
  activeReplyTargetName?: string;
  onExpandReplies: (commentId: string) => void;
  onToggleReaction: (targetId: string, emoji: string) => void;
  onStartReply: (
    commentId: string,
    targetAuthorName: string,
    replyTo?: { id?: string; name: string }
  ) => void;
  onCancelReply: () => void;
  onSubmitReply: (commentId: string, content: string) => void;
  onEditComment: (targetId: string, newContent: string) => void;
  onDeleteComment: (targetId: string) => void;
  onReportComment: (targetId: string) => void;
}

export function CommentItem({
  comment,
  referenceTime,
  currentUserId,
  currentUserName,
  isExpanded,
  isReplying,
  activeReplyTargetName,
  onExpandReplies,
  onToggleReaction,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onEditComment,
  onDeleteComment,
  onReportComment,
}: CommentItemProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  useEffect(() => {
    if (!openMenuId) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        !(
          event.target instanceof Element &&
          event.target.closest('[data-comment-menu]')
        )
      ) {
        setOpenMenuId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  const initialLimit = comment.initialVisibleReplies ?? comment.replies.length;
  const visibleReplies = isExpanded
    ? comment.replies
    : comment.replies.slice(0, initialLimit);
  const hiddenCount = Math.max(0, comment.replies.length - visibleReplies.length);

  const handleStartEdit = (targetId: string, currentContent: string) => {
    setOpenMenuId(null);
    setEditingId(targetId);
    setEditDraft(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const handleSaveEdit = (
    targetId: string,
    currentContent: string,
    e: React.FormEvent
  ) => {
    e.preventDefault();
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    if (trimmed === currentContent.trim()) {
      handleCancelEdit();
      return;
    }
    onEditComment(targetId, trimmed);
    setEditingId(null);
    setEditDraft('');
  };

  const renderActionMenu = (
    itemId: string,
    authorId: string,
    currentContent: string
  ) => {
    const isOwner = authorId === currentUserId;
    const isMenuOpen = openMenuId === itemId;

    return (
      <div data-comment-menu className="relative shrink-0">
        <button
          type="button"
          onClick={() =>
            setOpenMenuId((prev) => (prev === itemId ? null : itemId))
          }
          aria-label="ตัวเลือกความคิดเห็น"
          aria-expanded={isMenuOpen}
          className="px-2 py-0.5 rounded-md text-xs text-[#71717a] hover:text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer select-none leading-none tracking-wider"
        >
          •••
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            aria-label="ตัวเลือกความคิดเห็น"
            className="absolute right-0 top-[calc(100%+4px)] z-20 w-[168px] rounded-[10px] border border-[#e4e4e7] bg-white p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col"
          >
            {isOwner ? (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStartEdit(itemId, currentContent)}
                  className="w-full text-left px-2.5 py-2 rounded-md text-xs sm:text-sm text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  แก้ไขความคิดเห็น
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenMenuId(null);
                    onDeleteComment(itemId);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-md text-xs sm:text-sm text-[#dc2626] hover:bg-red-50 transition-colors cursor-pointer"
                >
                  ลบความคิดเห็น
                </button>
              </>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpenMenuId(null);
                  onReportComment(itemId);
                }}
                className="w-full text-left px-2.5 py-2 rounded-md text-xs sm:text-sm text-[#dc2626] hover:bg-red-50 transition-colors cursor-pointer"
              >
                รายงานความคิดเห็น
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderEditForm = (itemId: string, currentContent: string) => (
    <form
      onSubmit={(e) => handleSaveEdit(itemId, currentContent, e)}
      className="space-y-2 pt-1"
    >
      <input
        type="text"
        value={editDraft}
        onChange={(e) => setEditDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleCancelEdit();
          }
        }}
        autoFocus
        aria-label="แก้ไขความคิดเห็น"
        className="w-full h-9 rounded-lg border border-[#e4e4e7] bg-white px-3 text-sm text-[#18181b] focus:outline-none focus:border-zinc-400"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={editDraft.trim().length === 0}
          className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors select-none ${editDraft.trim().length > 0
            ? 'bg-[#18181b] text-white hover:bg-zinc-800 cursor-pointer'
            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
        >
          บันทึก
        </button>
        <button
          type="button"
          onClick={handleCancelEdit}
          className="h-8 px-3 rounded-lg border border-[#e4e4e7] bg-white text-xs text-[#71717a] hover:text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer select-none"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );

  return (
    <div className="py-3.5">
      {/* Top-level comment */}
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-[#d4d4d8] shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-semibold text-[#18181b]">
                {comment.author.name}
              </span>
              {comment.isPostAuthor && (
                <span className="inline-flex items-center rounded-full bg-[#18181b] px-2.5 py-0.5 text-[11px] font-medium text-white">
                  เจ้าของกระทู้
                </span>
              )}
              <time
                dateTime={comment.createdAt}
                className="text-xs text-[#71717a]"
              >
                {formatRelativeTimeThai(comment.createdAt, referenceTime)}
                {comment.isEdited ? ' (แก้ไขแล้ว)' : ''}
              </time>
            </div>

            {renderActionMenu(comment.id, comment.author.id, comment.content)}
          </div>

          {editingId === comment.id ? (
            renderEditForm(comment.id, comment.content)
          ) : (
            <p className="text-sm text-[#18181b] leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-2 pt-0.5">
            <ReactionBar
              reactions={comment.reactions}
              onToggleReaction={(emoji) => onToggleReaction(comment.id, emoji)}
              size="sm"
            />
            <button
              type="button"
              onClick={() => onStartReply(comment.id, comment.author.name)}
              className="text-xs font-medium text-[#71717a] hover:text-[#18181b] transition-colors cursor-pointer select-none px-1"
            >
              ตอบกลับ
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies or inline reply composer */}
      {(comment.replies.length > 0 || isReplying) && (
        <div className="ml-4 mt-2 pl-5 border-l-2 border-[#e4e4e7] space-y-1">
          {visibleReplies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3 py-2.5">
              <div
                aria-hidden="true"
                className="w-7 h-7 rounded-full bg-[#d4d4d8] shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-semibold text-[#18181b]">
                      {reply.author.name}
                    </span>
                    {reply.replyTo && (
                      <span className="inline-flex items-center gap-1 text-sm text-[#71717a]">
                        <span>ตอบกลับ</span>
                        <span className="font-medium text-[#18181b]">
                          @{reply.replyTo.name}
                        </span>
                      </span>
                    )}
                    {reply.isPostAuthor && (
                      <span className="inline-flex items-center rounded-full bg-[#18181b] px-2.5 py-0.5 text-[11px] font-medium text-white">
                        เจ้าของกระทู้
                      </span>
                    )}
                    <time
                      dateTime={reply.createdAt}
                      className="text-xs text-[#71717a]"
                    >
                      {formatRelativeTimeThai(reply.createdAt, referenceTime)}
                      {reply.isEdited ? ' (แก้ไขแล้ว)' : ''}
                    </time>
                  </div>

                  {renderActionMenu(reply.id, reply.author.id, reply.content)}
                </div>

                {editingId === reply.id ? (
                  renderEditForm(reply.id, reply.content)
                ) : (
                  <p className="text-sm text-[#18181b] leading-relaxed whitespace-pre-wrap break-words">
                    {reply.content}
                  </p>
                )}

                <div className="flex items-center flex-wrap gap-2 pt-0.5">
                  <ReactionBar
                    reactions={reply.reactions}
                    onToggleReaction={(emoji) =>
                      onToggleReaction(reply.id, emoji)
                    }
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onStartReply(comment.id, reply.author.name, {
                        id: reply.author.id,
                        name: reply.author.name,
                      })
                    }
                    className="text-sm font-medium text-[#71717a] hover:text-[#18181b] transition-colors cursor-pointer select-none px-1"
                  >
                    ตอบกลับ
                  </button>
                </div>
              </div>
            </div>
          ))}

          {hiddenCount > 0 && (
            <div className="pl-10 py-1.5">
              <button
                type="button"
                onClick={() => onExpandReplies(comment.id)}
                className="text-[13px] font-medium text-[#18181b] hover:underline cursor-pointer select-none"
              >
                ดูอีก {hiddenCount} ความคิดเห็น
              </button>
            </div>
          )}

          {isReplying && (
            <div className="pl-2 pt-1 pb-2">
              <ReplyComposer
                currentUserName={currentUserName}
                placeholder={`ตอบกลับ ${activeReplyTargetName ?? comment.author.name} ในชื่อ ${currentUserName}...`}
                onSubmit={(content) => onSubmitReply(comment.id, content)}
                onCancel={onCancelReply}
                autoFocus
                size="sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
