'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import type {
  CommentSortOrder,
  PostThread,
  ThreadAuthor,
} from '@/types/post-thread';
import {
  addNestedReply,
  addTopLevelComment,
  countTotalComments,
  sortComments,
  toggleCommentReaction,
  togglePostReaction,
} from '@/lib/post-thread';
import { PostCard } from '@/components/post-thread/PostCard';
import { ReplyComposer } from '@/components/post-thread/ReplyComposer';
import { CommentItem } from '@/components/post-thread/CommentItem';
import { ReportModal } from '@/components/post-thread/ReportModal';

interface PostThreadClientProps {
  initialThread: PostThread;
  currentUser: ThreadAuthor;
  serverTime: string;
}

export function PostThreadClient({
  initialThread,
  currentUser,
  serverTime,
}: PostThreadClientProps) {
  const [thread, setThread] = useState<PostThread>(initialThread);
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>('oldest');
  const [expandedCommentIds, setExpandedCommentIds] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    targetName: string;
  } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mainReplyInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const referenceTime = useMemo(
    () => new Date(serverTime).getTime(),
    [serverTime]
  );

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
    const nowIso = new Date().toISOString();
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
    const nowIso = new Date().toISOString();
    setThread((prev) => ({
      ...prev,
      comments: addNestedReply(
        prev.comments,
        commentId,
        content,
        currentUser,
        nowIso,
        prev.author.id
      ),
    }));
    setExpandedCommentIds((prev) =>
      prev.includes(commentId) ? prev : [...prev, commentId]
    );
    setReplyingTo(null);
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
    setIsReportModalOpen(false);
    showToast('ส่งรายงานกระทู้ให้ทีมงานตรวจสอบเรียบร้อยแล้ว');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#18181b] font-sans">
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-4">
        {/* Back link */}
        <div>
          <Link
            href="/"
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
          onReportClick={() => setIsReportModalOpen(true)}
        />

        {/* Reply Composer */}
        <ReplyComposer
          currentUserName={currentUser.name}
          inputRef={mainReplyInputRef}
          onSubmit={handleAddTopLevelComment}
        />

        {/* Comments Header & Sort Control */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <h2 className="text-base font-semibold text-[#18181b]">
            {totalComments} ความคิดเห็น
          </h2>

          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === 'oldest' ? 'newest' : 'oldest'))
            }
            className="h-8 px-3.5 rounded-full border border-[#e4e4e7] bg-white text-xs sm:text-[13px] font-medium text-[#18181b] hover:bg-zinc-100 transition-colors inline-flex items-center gap-2 cursor-pointer select-none"
          >
            <span>{sortOrder === 'oldest' ? 'เก่าสุดก่อน' : 'ใหม่สุดก่อน'}</span>
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="text-[#71717a]"
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
        </div>

        {/* Replies List Card */}
        <section
          aria-label="รายการความคิดเห็น"
          className="bg-white border border-[#e4e4e7] rounded-xl px-6 py-2 divide-y divide-[#e4e4e7]"
        >
          {sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              referenceTime={referenceTime}
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
              onStartReply={(commentId, targetName) =>
                setReplyingTo({ commentId, targetName })
              }
              onCancelReply={() => setReplyingTo(null)}
              onSubmitReply={handleAddNestedReply}
            />
          ))}
        </section>
      </main>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
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

