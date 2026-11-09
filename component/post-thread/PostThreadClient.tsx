'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import type {
  CommentSortOrder,
  PostThread,
  ReportTargetType,
  ThreadAuthor,
} from '@/types/post-thread';
import {
  addNestedReply,
  addTopLevelComment,
  countTotalComments,
  deleteCommentOrReply,
  editCommentOrReply,
  sortComments,
  toggleCommentReaction,
  togglePostReaction,
  TIME_REFRESH_INTERVAL_MS,
} from '@/lib/post-thread';
import Header from '@/component/Header';
import { currentUser as mockCurrentUser, myRooms } from '@/lib/mock';
import { PostCard } from './PostCard';
import { ReplyComposer } from './ReplyComposer';
import { CommentItem } from './CommentItem';
import { ReportModal } from './ReportModal';

interface PostThreadClientProps {
  initialThread: PostThread;
  currentUser: ThreadAuthor;
  serverTime: string;
}

const SORT_OPTIONS: { value: CommentSortOrder; label: string }[] = [
  { value: 'oldest', label: 'เก่าสุดก่อน' },
  { value: 'newest', label: 'ใหม่สุดก่อน' },
];

export function PostThreadClient({
  initialThread,
  currentUser,
  serverTime,
}: PostThreadClientProps) {
  const [thread, setThread] = useState<PostThread>(initialThread);
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>('oldest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [expandedCommentIds, setExpandedCommentIds] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    targetName: string;
    replyTo?: { id?: string; name: string };
  } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType;
    id: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mainReplyInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSortMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setIsSortMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSortMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortMenuOpen]);

  const [referenceTime, setReferenceTime] = useState<number>(() => {
    const parsed = Date.parse(serverTime);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setReferenceTime(Date.now());
    }, TIME_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const sortedComments = useMemo(
    () => sortComments(thread.comments, sortOrder),
    [thread.comments, sortOrder]
  );

  const totalComments = useMemo(
    () => countTotalComments(thread.comments),
    [thread.comments]
  );

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const handleTogglePostReaction = (emoji: string) => {
    setThread((prev) => togglePostReaction(prev, emoji));
  };

  const handleToggleCommentReaction = (targetId: string, emoji: string) => {
    setThread((prev) => ({
      ...prev,
      comments: toggleCommentReaction(prev.comments, targetId, emoji),
    }));
  };

  const handleAddTopLevelComment = (content: string) => {
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    setReferenceTime(nowMs);
    setThread((prev) => ({
      ...prev,
      comments: addTopLevelComment(
        prev.comments,
        content,
        currentUser,
        nowIso,
        prev.author.id
      ),
    }));
  };

  const handleAddNestedReply = (commentId: string, content: string) => {
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    setReferenceTime(nowMs);
    const replyTo =
      replyingTo?.commentId === commentId ? replyingTo.replyTo : undefined;
    setThread((prev) => ({
      ...prev,
      comments: addNestedReply(
        prev.comments,
        commentId,
        content,
        currentUser,
        nowIso,
        prev.author.id,
        replyTo
      ),
    }));
    setExpandedCommentIds((prev) =>
      prev.includes(commentId) ? prev : [...prev, commentId]
    );
    setReplyingTo(null);
  };

  const handleEditComment = (targetId: string, newContent: string) => {
    setThread((prev) => ({
      ...prev,
      comments: editCommentOrReply(
        prev.comments,
        targetId,
        newContent,
        currentUser.id
      ),
    }));
    showToast('แก้ไขความคิดเห็นเรียบร้อยแล้ว');
  };

  const handleDeleteComment = (targetId: string) => {
    setThread((prev) => ({
      ...prev,
      comments: deleteCommentOrReply(prev.comments, targetId, currentUser.id),
    }));
    if (replyingTo?.commentId === targetId) {
      setReplyingTo(null);
    }
    showToast('ลบความคิดเห็นเรียบร้อยแล้ว');
  };

  const handleReportComment = (targetId: string) => {
    setReportTarget({ type: 'comment', id: targetId });
  };

  const handleExpandReplies = (commentId: string) => {
    setExpandedCommentIds((prev) =>
      prev.includes(commentId) ? prev : [...prev, commentId]
    );
  };

  const handleCopyOrShare = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Clipboard fallback ignored in mock environment
    }
    showToast('คัดลอกลิงก์กระทู้เรียบร้อยแล้ว');
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      showToast(
        next
          ? 'ปิดการแจ้งเตือนสำหรับกระทู้นี้แล้ว'
          : 'เปิดการแจ้งเตือนสำหรับกระทู้นี้แล้ว'
      );
      return next;
    });
  };

  const handleReportSubmit = () => {
    const targetType = reportTarget?.type ?? 'post';
    setReportTarget(null);
    showToast(
      targetType === 'comment'
        ? 'ส่งรายงานความคิดเห็นให้ทีมงานตรวจสอบเรียบร้อยแล้ว'
        : 'ส่งรายงานกระทู้ให้ทีมงานตรวจสอบเรียบร้อยแล้ว'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-[#18181b] font-sans">
      <Header
        notifications={mockCurrentUser.notifications}
        rooms={myRooms}
        alias={mockCurrentUser.alias}
      />
      <main className="w-full max-w-[760px] mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-4 flex-1">
        {/* Back link */}
        <div>
          <Link
            href={`/rooms/${thread.boardSlug}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#18181b] transition-colors"
          >
            <span aria-hidden="true">←</span>
            <span>กลับไปใน{thread.boardName}</span>
          </Link>
        </div>

        {/* Main Post Card */}
        <PostCard
          thread={thread}
          referenceTime={referenceTime}
          isMuted={isMuted}
          onToggleReaction={handleTogglePostReaction}
          onReplyClick={() => mainReplyInputRef.current?.focus()}
          onShareClick={handleCopyOrShare}
          onCopyLinkClick={handleCopyOrShare}
          onToggleMuteClick={handleToggleMute}
          onReportClick={() => setReportTarget({ type: 'post', id: thread.id })}
        />

        {/* Reply Composer */}
        <ReplyComposer
          currentUserName={currentUser.name}
          inputRef={mainReplyInputRef}
          onSubmit={handleAddTopLevelComment}
        />

        {/* Comments Header & Sort Dropdown */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <h2 className="text-base font-semibold text-[#18181b]">
            {totalComments} ความคิดเห็น
          </h2>

          <div ref={sortMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsSortMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isSortMenuOpen}
              className="h-8 px-3 rounded-lg border border-[#e4e4e7] bg-white text-xs sm:text-[13px] font-medium text-[#18181b] hover:bg-zinc-100 transition-colors inline-flex items-center gap-2 cursor-pointer select-none"
            >
              <span>{sortOrder === 'oldest' ? 'เก่าสุดก่อน' : 'ใหม่สุดก่อน'}</span>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className={`text-[#71717a] transition-transform duration-200 ${
                  isSortMenuOpen ? 'rotate-180' : ''
                }`}
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isSortMenuOpen && (
              <div
                role="menu"
                aria-label="ตัวเลือกการจัดเรียงความคิดเห็น"
                className="absolute right-0 top-[calc(100%+4px)] z-20 w-[140px] rounded-[10px] border border-[#e4e4e7] bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col"
              >
                {SORT_OPTIONS.map((option) => {
                  const isSelected = sortOrder === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setSortOrder(option.value);
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs sm:text-[13px] transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-zinc-100 font-semibold text-[#18181b]'
                          : 'text-[#71717a] hover:bg-zinc-50 hover:text-[#18181b]'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="text-[#18181b] shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Replies List Card */}
        <section
          aria-label="รายการความคิดเห็น"
          className="bg-white border border-[#e4e4e7] rounded-xl px-4 sm:px-6 py-2 divide-y divide-[#e4e4e7]"
        >
          {sortedComments.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#71717a]">
              ยังไม่มีความคิดเห็น · มาเป็นคนแรกที่พูดคุยในกระทู้นี้กัน
            </p>
          ) : (
            sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                referenceTime={referenceTime}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
                isExpanded={expandedCommentIds.includes(comment.id)}
                isReplying={replyingTo?.commentId === comment.id}
                activeReplyTargetName={
                  replyingTo?.commentId === comment.id
                    ? replyingTo.targetName
                    : undefined
                }
                onExpandReplies={handleExpandReplies}
                onToggleReaction={handleToggleCommentReaction}
                onStartReply={(commentId, targetName, replyTo) =>
                  setReplyingTo({ commentId, targetName, replyTo })
                }
                onCancelReply={() => setReplyingTo(null)}
                onSubmitReply={handleAddNestedReply}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onReportComment={handleReportComment}
              />
            ))
          )}
        </section>
      </main>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportTarget !== null}
        targetType={reportTarget?.type ?? 'post'}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReportSubmit}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#18181b] text-white text-sm px-4 py-3 rounded-xl shadow-lg border border-zinc-800 flex items-center gap-2"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
