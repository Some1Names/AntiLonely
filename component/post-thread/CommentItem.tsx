'use client';

import React, { useState, useEffect } from 'react';
import type { ThreadComment, ThreadReply, ThreadBranch } from '@/types/post-thread';
import { formatRelativeTimeThai, groupRepliesIntoBranches } from '@/lib/post-thread';
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
  activeReplyTargetId?: string;
  onExpandReplies: (commentId: string) => void;
  onToggleReaction: (targetId: string, emoji: string) => void;
  onStartReply: (
    commentId: string,
    targetAuthorName: string,
    replyTo?: { id?: string; name: string; isNested?: boolean },
    targetReplyId?: string
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
  activeReplyTargetId,
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
          aria-label="ตัวเลือกเพิ่มเติม"
          aria-expanded={isMenuOpen}
          className="px-2 py-0.5 rounded-md text-xs text-[#71717a] hover:text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer select-none leading-none tracking-wider relative flex items-center justify-center min-w-[28px] min-h-[28px] after:absolute after:w-[44px] after:h-[44px] after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
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
    <div data-comment-item className="py-3.5">
      {/* Top-level comment */}
      <div className="relative flex items-start gap-3">
        {/* Avatar column with thread line starting directly below avatar */}
        <div className="relative flex flex-col items-center self-stretch shrink-0">
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-[#d4d4d8] shrink-0 mt-0.5 z-10"
          />
          {(comment.replies.length > 0 || isReplying) && (
            <div
              aria-hidden="true"
              className="w-0.5 grow bg-[#e4e4e7] mt-1 -mb-3.5 pointer-events-none"
            />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5 pb-1">
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
                suppressHydrationWarning
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

          <div className="flex items-center flex-wrap gap-x-2 gap-y-3 pt-0.5">
            <ReactionBar
              reactions={comment.reactions}
              onToggleReaction={(emoji) => onToggleReaction(comment.id, emoji)}
              size="sm"
              pickerId={`comment-${comment.id}`}
            />
            <button
              type="button"
              onClick={() =>
                onStartReply(
                  comment.id,
                  comment.author.name,
                  comment.author.id !== currentUserId &&
                    comment.author.name !== currentUserName
                    ? { id: comment.author.id, name: comment.author.name, isNested: false }
                    : undefined,
                  comment.id
                )
              }
              className="text-xs font-medium text-[#71717a] hover:text-[#18181b] transition-colors cursor-pointer select-none px-1 relative after:absolute after:inset-y-[-14px] after:inset-x-0 after:content-['']"
            >
              ตอบกลับ
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies or inline reply composer */}
      {(comment.replies.length > 0 || isReplying) && (() => {
        const branches = groupRepliesIntoBranches(visibleReplies, comment.author.name);

        const isTargetInBranch = (branch: ThreadBranch) => {
          if (activeReplyTargetId) {
            return (
              branch.parent.id === activeReplyTargetId ||
              branch.children.some((c) => c.id === activeReplyTargetId)
            );
          }
          if (activeReplyTargetName) {
            if (activeReplyTargetName === comment.author.name) return false;
            return (
              branch.parent.author.name === activeReplyTargetName ||
              branch.children.some((c) => c.author.name === activeReplyTargetName)
            );
          }
          return false;
        };

        const isReplyingToTopComment =
          isReplying &&
          (!activeReplyTargetId || activeReplyTargetId === comment.id) &&
          (!activeReplyTargetName || activeReplyTargetName === comment.author.name);

        const anyBranchMatched = branches.some(isTargetInBranch);
        const showComposerAtRoot =
          isReplying && (isReplyingToTopComment || !anyBranchMatched);

        const renderReplyItem = (
          reply: ThreadReply,
          isChild: boolean,
          hasSubChildren = false,
          isLastItem = false,
          isFirstChild = false,
          isFirstLevel1 = false
        ) => (
          <div
            key={reply.id}
            data-comment-item
            className="relative flex items-start gap-3 py-2.5 transition-all"
          >
            {/* If not the last item in this sub-branch, continue vertical line down to next sibling (with 4px overlap) */}
            {isChild && !isLastItem && (
              <div
                aria-hidden="true"
                className="absolute -left-6 top-0 -bottom-1 w-0.5 bg-[#e4e4e7] pointer-events-none"
              />
            )}

            {/* Elbow connector branching from guide line into avatar center at 26px */}
            <div
              aria-hidden="true"
              className={
                isFirstChild
                  ? 'absolute -left-6 -top-5 w-6 h-[46px] border-b-2 border-l-2 border-[#e4e4e7] rounded-bl-xl pointer-events-none'
                  : isFirstLevel1
                  ? 'absolute -left-6 -top-2 w-6 h-[34px] border-b-2 border-l-2 border-[#e4e4e7] rounded-bl-xl pointer-events-none'
                  : 'absolute -left-6 top-0 w-6 h-[26px] border-b-2 border-l-2 border-[#e4e4e7] rounded-bl-xl pointer-events-none'
              }
            />

            {/* Avatar column */}
            <div className="relative flex flex-col items-center self-stretch shrink-0">
              <div
                aria-hidden="true"
                className="w-7 h-7 rounded-full bg-[#d4d4d8] shrink-0 mt-0.5 z-10"
              />
              {/* If this reply has children, run vertical line down to sub-branch with overlap */}
              {hasSubChildren && (
                <div
                  aria-hidden="true"
                  className="w-0.5 grow bg-[#e4e4e7] mt-1 -mb-3.5 pointer-events-none"
                />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm font-semibold text-[#18181b]">
                    {reply.author.name}
                  </span>
                  {reply.replyTo &&
                    reply.replyTo.name !== reply.author.name && (
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
                    suppressHydrationWarning
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

              <div className="flex items-center flex-wrap gap-x-2 gap-y-3 pt-0.5">
                <ReactionBar
                  reactions={reply.reactions}
                  onToggleReaction={(emoji) =>
                    onToggleReaction(reply.id, emoji)
                  }
                  size="sm"
                  pickerId={`reply-${reply.id}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    onStartReply(
                      comment.id,
                      reply.author.name,
                      {
                        id: reply.id,
                        name: reply.author.name,
                        isNested: true,
                      },
                      reply.id
                    )
                  }
                  className="text-xs md:text-sm font-medium text-[#71717a] hover:text-[#18181b] transition-colors cursor-pointer select-none px-1 relative after:absolute after:inset-y-[-14px] after:inset-x-0 after:content-['']"
                >
                  ตอบกลับ
                </button>
              </div>
            </div>
          </div>
        );

        return (
          <div className="relative ml-[15px] pl-6">
            {branches.map((branch, branchIndex) => {
              const isReplyingToThisBranch = isReplying && isTargetInBranch(branch);
              const hasSubChildren =
                branch.children.length > 0 || isReplyingToThisBranch;
              const isLastLevel1 =
                branchIndex === branches.length - 1 && !showComposerAtRoot;
              const isFirstLevel1 = branchIndex === 0;

              return (
                <div key={branch.parent.id} className="relative">
                  {/* Vertical trunk line connecting to next Level 1 branch (with 4px overlap) */}
                  {!isLastLevel1 && (
                    <div
                      aria-hidden="true"
                      className={`absolute -left-6 ${isFirstLevel1 ? '-top-2' : 'top-0'} -bottom-1 w-0.5 bg-[#e4e4e7] pointer-events-none`}
                    />
                  )}

                  {/* Level 1 Reply */}
                  {renderReplyItem(
                    branch.parent,
                    false,
                    hasSubChildren,
                    isLastLevel1,
                    false,
                    isFirstLevel1
                  )}

                  {/* Level 2 Sub-branch: renders only if branch has children or composer is active here */}
                  {hasSubChildren && (
                    <div className="relative ml-[13px] pl-6">
                      {branch.children.map((child, childIndex) => {
                        const isLastChild =
                          childIndex === branch.children.length - 1 &&
                          !isReplyingToThisBranch;
                        const isFirstChild = childIndex === 0;

                        return renderReplyItem(
                          child,
                          true,
                          false,
                          isLastChild,
                          isFirstChild
                        );
                      })}

                      {isReplyingToThisBranch && (
                        <div className="relative pt-1 pb-2">
                          <div
                            aria-hidden="true"
                            className={
                              branch.children.length === 0
                                ? 'absolute -left-6 -top-5 w-6 h-[46px] border-b-2 border-l-2 border-[#e4e4e7] rounded-bl-xl pointer-events-none'
                                : 'absolute -left-6 top-0 w-6 h-[26px] border-b-2 border-l-2 border-[#e4e4e7] rounded-bl-xl pointer-events-none'
                            }
                          />
                          <ReplyComposer
                            currentUserName={currentUserName}
                            placeholder={
                              activeReplyTargetName && activeReplyTargetName !== currentUserName
                                ? `ตอบกลับ ${activeReplyTargetName} ในชื่อ ${currentUserName}...`
                                : `ตอบกลับในชื่อ ${currentUserName}...`
                            }
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
            })}

            {hiddenCount > 0 && (
              <div className="pl-2 py-2">
                <button
                  type="button"
                  onClick={() => onExpandReplies(comment.id)}
                  className="text-[13px] font-medium text-[#18181b] hover:underline cursor-pointer select-none"
                >
                  ดูอีก {hiddenCount} ความคิดเห็น
                </button>
              </div>
            )}

            {showComposerAtRoot && (
              <div className="relative pt-1 pb-2">
                <div
                  aria-hidden="true"
                  className={
                    branches.length === 0
                      ? 'absolute -left-6 -top-2 w-6 h-[34px] border-b-2 border-l-2 border-[#e4e4e7] rounded-bl-xl pointer-events-none'
                      : 'absolute -left-6 top-0 w-6 h-[26px] border-b-2 border-l-2 border-[#e4e4e7] rounded-bl-xl pointer-events-none'
                  }
                />
                <ReplyComposer
                  currentUserName={currentUserName}
                  placeholder={
                    activeReplyTargetName && activeReplyTargetName !== currentUserName
                      ? `ตอบกลับ ${activeReplyTargetName} ในชื่อ ${currentUserName}...`
                      : activeReplyTargetName === currentUserName
                      ? `ตอบกลับในชื่อ ${currentUserName}...`
                      : comment.author.name !== currentUserName
                      ? `ตอบกลับ ${comment.author.name} ในชื่อ ${currentUserName}...`
                      : `ตอบกลับในชื่อ ${currentUserName}...`
                  }
                  onSubmit={(content) => onSubmitReply(comment.id, content)}
                  onCancel={onCancelReply}
                  autoFocus
                  size="sm"
                />
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
