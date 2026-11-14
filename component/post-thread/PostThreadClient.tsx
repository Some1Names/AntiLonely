'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import type {
  CommentSortOrder,
  PostThread,
  ReactionItem,
  ReportReason,
  ReportTargetType,
} from '@/types/post-thread';
import type { MyRoom } from '@/types/room';
import {
  addNestedReply,
  addTopLevelComment,
  applyReactionActiveState,
  countTotalComments,
  createReactionMutationTracker,
  editCommentOrReply,
  sortComments,
  TIME_REFRESH_INTERVAL_MS,
  type ReactionMutationTracker,
} from '@/lib/post-thread';
import { syncReactionMutation } from '@/lib/reaction-client';
import {
  collectClientSubtreeIds,
  deleteCommentSubtreeOptimistic,
  removeDeletedIdsFromComments,
} from '@/lib/post-thread-mapper';
import { canMemberReactInRoom, type DbMemberStatus } from '@/lib/room-board';
import {
  createThreadReply,
  deleteThreadMessage,
  reportThreadTarget,
  updateThreadMessage,
} from '@/app/rooms/[roomId]/posts/[postId]/actions';
import Header from '@/component/Header';
import { PostCard } from './PostCard';
import { ReplyComposer } from './ReplyComposer';
import { CommentItem } from './CommentItem';
import { ReportModal } from './ReportModal';
import {
  dangerButtonClass,
  indexCardClass,
  outlineButtonClass,
} from '@/lib/styles';

interface PostThreadClientProps {
  room: {
    id: string;
    slug: string;
    name: string;
    isPrivate: boolean;
    isLocked: boolean;
  };
  memberStatus: DbMemberStatus | null;
  canComment: boolean;
  canReact: boolean;
  initialThread: PostThread;
  currentUser: {
    id: string;
    alias: string;
    notifications: number;
  } | null;
  myRooms: MyRoom[];
  serverTime: string;
}

const SORT_OPTIONS: { value: CommentSortOrder; label: string }[] = [
  { value: 'oldest', label: 'เก่าสุดก่อน' },
  { value: 'newest', label: 'ใหม่สุดก่อน' },
];

function replaceMessageReactionsInComments(
  comments: PostThread['comments'],
  targetId: string,
  updater: (current: readonly ReactionItem[]) => ReactionItem[]
): PostThread['comments'] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return { ...comment, reactions: updater(comment.reactions) };
    }
    if (!comment.replies.some((reply) => reply.id === targetId)) {
      return comment;
    }
    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === targetId
          ? { ...reply, reactions: updater(reply.reactions) }
          : reply
      ),
    };
  });
}

function findMessageReactionsInComments(
  comments: PostThread['comments'],
  targetId: string
): ReactionItem[] {
  for (const comment of comments) {
    if (comment.id === targetId) {
      return comment.reactions;
    }
    const matchedReply = comment.replies.find((reply) => reply.id === targetId);
    if (matchedReply) {
      return matchedReply.reactions;
    }
  }
  return [];
}

function getDisabledCommentNotice(input: {
  isAuthenticated: boolean;
  isLocked: boolean;
  memberStatus: DbMemberStatus | null;
}): { message: string; showJoinLink: boolean } {
  if (!input.isAuthenticated) {
    return {
      message: 'เข้าสู่ระบบและเข้าร่วมห้องก่อนจึงจะแสดงความคิดเห็นได้',
      showJoinLink: true,
    };
  }
  if (input.isLocked) {
    return {
      message: 'ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถแสดงความคิดเห็นเพิ่มเติมได้',
      showJoinLink: false,
    };
  }
  if (input.memberStatus === 'muted') {
    return {
      message: 'คุณถูกจำกัดสิทธิ์การแสดงความคิดเห็นในห้องนี้ชั่วคราว',
      showJoinLink: false,
    };
  }
  if (input.memberStatus === 'banned') {
    return {
      message: 'คุณถูกระงับสิทธิ์การใช้งานในห้องนี้',
      showJoinLink: false,
    };
  }
  return {
    message: 'เข้าร่วมห้องก่อนจึงจะแสดงความคิดเห็นและตอบกลับในกระทู้นี้ได้',
    showJoinLink: true,
  };
}

export function PostThreadClient({
  room,
  memberStatus,
  canComment,
  canReact,
  initialThread,
  currentUser,
  myRooms,
  serverTime,
}: PostThreadClientProps) {
  const [thread, setThread] = useState<PostThread>(initialThread);
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>('oldest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [expandedCommentIds, setExpandedCommentIds] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    targetName: string;
    replyTo?: { id?: string; name: string; isNested?: boolean };
    targetReplyId?: string;
  } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType;
    id: string;
  } | null>(null);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState<{
    id: string;
    descendantCount: number;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mainReplyInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const reactionTrackerRef = useRef<ReactionMutationTracker | null>(null);
  const threadRef = useRef(thread);
  const replyingToRef = useRef(replyingTo);

  useLayoutEffect(() => {
    threadRef.current = thread;
    replyingToRef.current = replyingTo;
  }, [thread, replyingTo]);

  const getReactionTracker = useCallback((): ReactionMutationTracker => {
    if (!reactionTrackerRef.current) {
      reactionTrackerRef.current = createReactionMutationTracker();
    }
    return reactionTrackerRef.current;
  }, []);

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

  useEffect(() => {
    if (!pendingDeleteTarget) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPendingDeleteTarget(null);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pendingDeleteTarget]);

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

  const disabledCommentNotice = useMemo(
    () =>
      getDisabledCommentNotice({
        isAuthenticated: Boolean(currentUser),
        isLocked: room.isLocked,
        memberStatus,
      }),
    [currentUser, room.isLocked, memberStatus]
  );

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  const ensureReactAllowed = useCallback((): boolean => {
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนกดรีแอคชัน');
      return false;
    }
    const perm = canMemberReactInRoom({
      isPrivate: room.isPrivate,
      memberStatus,
    });
    if (!perm.ok) {
      showToast(perm.error);
      return false;
    }
    if (!canReact) {
      showToast('คุณไม่มีสิทธิ์กดรีแอคชันในห้องนี้');
      return false;
    }
    return true;
  }, [canReact, currentUser, memberStatus, room.isPrivate, showToast]);

  const handleTogglePostReaction = useCallback(
    async (emoji: string): Promise<boolean> => {
      if (!ensureReactAllowed()) {
        return false;
      }

      const targetId = thread.id;
      return syncReactionMutation({
        tracker: getReactionTracker(),
        roomId: room.id,
        postId: targetId,
        messageId: targetId,
        emoji,
        currentReactions: threadRef.current.reactions,
        applyOptimisticActive: (desiredActive) => {
          setThread((prev) => ({
            ...prev,
            reactions: applyReactionActiveState(
              prev.reactions,
              emoji,
              desiredActive
            ),
          }));
        },
        applyResolvedReactions: (updater) => {
          setThread((prev) => ({
            ...prev,
            reactions: updater(prev.reactions),
          }));
        },
        onError: showToast,
      });
    },
    [ensureReactAllowed, getReactionTracker, room.id, showToast, thread.id]
  );

  const handleToggleCommentReaction = useCallback(
    async (targetId: string, emoji: string): Promise<boolean> => {
      if (!ensureReactAllowed()) {
        return false;
      }

      const currentReactions = findMessageReactionsInComments(
        threadRef.current.comments,
        targetId
      );

      return syncReactionMutation({
        tracker: getReactionTracker(),
        roomId: room.id,
        postId: thread.id,
        messageId: targetId,
        emoji,
        currentReactions,
        applyOptimisticActive: (desiredActive) => {
          setThread((prev) => ({
            ...prev,
            comments: replaceMessageReactionsInComments(
              prev.comments,
              targetId,
              (current) =>
                applyReactionActiveState(current, emoji, desiredActive)
            ),
          }));
        },
        applyResolvedReactions: (updater) => {
          setThread((prev) => ({
            ...prev,
            comments: replaceMessageReactionsInComments(
              prev.comments,
              targetId,
              updater
            ),
          }));
        },
        onError: showToast,
      });
    },
    [ensureReactAllowed, getReactionTracker, room.id, showToast, thread.id]
  );

  const handleAddTopLevelComment = async (content: string) => {
    if (!currentUser || !canComment) {
      showToast(disabledCommentNotice.message);
      return;
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const previousComments = thread.comments;
    setReferenceTime(nowMs);
    setThread((prev) => ({
      ...prev,
      comments: addTopLevelComment(
        prev.comments,
        content,
        { id: currentUser.id, name: currentUser.alias },
        nowIso,
        prev.author.id
      ),
    }));

    try {
      const result = await createThreadReply({
        roomId: room.id,
        postId: thread.id,
        parentId: thread.id,
        content,
      });
      if (!result.ok) {
        setThread((prev) => ({ ...prev, comments: previousComments }));
        showToast(result.error);
        return;
      }
      setThread(result.data.thread);
      showToast('เพิ่มความคิดเห็นเรียบร้อยแล้ว');
    } catch {
      setThread((prev) => ({ ...prev, comments: previousComments }));
      showToast('ไม่สามารถส่งความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleAddNestedReply = useCallback(
    async (commentId: string, content: string) => {
      if (!currentUser || !canComment) {
        showToast(disabledCommentNotice.message);
        return;
      }

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const previousComments = threadRef.current.comments;
      const previousReplyingTo = replyingToRef.current;
      const replyTo =
        previousReplyingTo?.commentId === commentId
          ? previousReplyingTo.replyTo
          : undefined;
      const parentId =
        previousReplyingTo?.commentId === commentId &&
        previousReplyingTo.targetReplyId
          ? previousReplyingTo.targetReplyId
          : commentId;

      setReferenceTime(nowMs);
      setThread((prev) => ({
        ...prev,
        comments: addNestedReply(
          prev.comments,
          parentId,
          content,
          { id: currentUser.id, name: currentUser.alias },
          nowIso,
          prev.author.id,
          replyTo
        ),
      }));
      setExpandedCommentIds((prev) =>
        prev.includes(commentId) ? prev : [...prev, commentId]
      );
      setReplyingTo(null);

      try {
        const result = await createThreadReply({
          roomId: room.id,
          postId: thread.id,
          parentId,
          content,
        });
        if (!result.ok) {
          setThread((prev) => ({ ...prev, comments: previousComments }));
          setReplyingTo(previousReplyingTo);
          showToast(result.error);
          return;
        }
        setThread(result.data.thread);
        showToast('ส่งข้อความตอบกลับเรียบร้อยแล้ว');
      } catch {
        setThread((prev) => ({ ...prev, comments: previousComments }));
        setReplyingTo(previousReplyingTo);
        showToast('ไม่สามารถส่งข้อความตอบกลับได้ กรุณาลองใหม่อีกครั้ง');
      }
    },
    [
      canComment,
      currentUser,
      disabledCommentNotice.message,
      room.id,
      showToast,
      thread.id,
    ]
  );

  const handleEditComment = useCallback(
    async (targetId: string, newContent: string) => {
      if (!currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อนแก้ไขความคิดเห็น');
        return;
      }

      const previousComments = threadRef.current.comments;
      setThread((prev) => ({
        ...prev,
        comments: editCommentOrReply(
          prev.comments,
          targetId,
          newContent,
          currentUser.id
        ),
      }));

      try {
        const result = await updateThreadMessage({
          roomId: room.id,
          postId: thread.id,
          messageId: targetId,
          content: newContent,
        });
        if (!result.ok) {
          setThread((prev) => ({ ...prev, comments: previousComments }));
          showToast(result.error);
          return;
        }
        showToast('แก้ไขความคิดเห็นเรียบร้อยแล้ว');
      } catch {
        setThread((prev) => ({ ...prev, comments: previousComments }));
        showToast('ไม่สามารถแก้ไขความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง');
      }
    },
    [currentUser, room.id, showToast, thread.id]
  );

  const handleRequestDeleteComment = useCallback(
    (targetId: string) => {
      if (!currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อนลบความคิดเห็น');
        return;
      }

      const subtreeIds = collectClientSubtreeIds(
        threadRef.current.comments,
        targetId
      );
      const descendantCount = Math.max(0, subtreeIds.length - 1);
      setPendingDeleteTarget({ id: targetId, descendantCount });
    },
    [currentUser, showToast]
  );

  const handleConfirmDeleteComment = async () => {
    const target = pendingDeleteTarget;
    if (!target) return;
    setPendingDeleteTarget(null);

    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนลบความคิดเห็น');
      return;
    }

    const previousComments = thread.comments;
    const { nextComments, removedIds } = deleteCommentSubtreeOptimistic(
      thread.comments,
      target.id,
      currentUser.id
    );
    const optimisticRemovedSet = new Set(removedIds);

    setThread((prev) => ({
      ...prev,
      comments: nextComments,
    }));
    if (
      replyingTo &&
      (optimisticRemovedSet.has(replyingTo.commentId) ||
        (replyingTo.targetReplyId &&
          optimisticRemovedSet.has(replyingTo.targetReplyId)))
    ) {
      setReplyingTo(null);
    }

    try {
      const result = await deleteThreadMessage({
        roomId: room.id,
        postId: thread.id,
        messageId: target.id,
      });
      if (!result.ok) {
        setThread((prev) => ({ ...prev, comments: previousComments }));
        showToast(result.error);
        return;
      }
      const deletedSet = new Set(result.data.deletedIds);
      setThread((prev) => ({
        ...prev,
        comments: removeDeletedIdsFromComments(prev.comments, deletedSet),
      }));
      if (
        replyingTo &&
        (deletedSet.has(replyingTo.commentId) ||
          (replyingTo.targetReplyId && deletedSet.has(replyingTo.targetReplyId)))
      ) {
        setReplyingTo(null);
      }
      showToast('ลบความคิดเห็นเรียบร้อยแล้ว');
    } catch {
      setThread((prev) => ({ ...prev, comments: previousComments }));
      showToast('ไม่สามารถลบความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleOpenReport = useCallback(
    (type: ReportTargetType, targetId: string) => {
      if (!currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อนส่งรายงาน');
        return;
      }
      const perm = canMemberReactInRoom({
        isPrivate: room.isPrivate,
        memberStatus,
      });
      if (!perm.ok) {
        showToast(perm.error);
        return;
      }
      setReportTarget({ type, id: targetId });
    },
    [currentUser, memberStatus, room.isPrivate, showToast]
  );

  const handleReportComment = useCallback(
    (targetId: string) => {
      handleOpenReport('comment', targetId);
    },
    [handleOpenReport]
  );

  const handlePostReportClick = useCallback(() => {
    handleOpenReport('post', thread.id);
  }, [handleOpenReport, thread.id]);

  const handleReplyClick = useCallback(() => {
    if (!canComment) {
      showToast(disabledCommentNotice.message);
      return;
    }
    mainReplyInputRef.current?.focus();
  }, [canComment, disabledCommentNotice.message, showToast]);

  const handleStartReply = useCallback(
    (
      commentId: string,
      targetName: string,
      replyTo?: { id?: string; name: string; isNested?: boolean },
      targetReplyId?: string
    ) => {
      if (!canComment) {
        showToast(disabledCommentNotice.message);
        return;
      }
      setReplyingTo({ commentId, targetName, replyTo, targetReplyId });
    },
    [canComment, disabledCommentNotice.message, showToast]
  );

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleExpandReplies = useCallback((commentId: string) => {
    setExpandedCommentIds((prev) =>
      prev.includes(commentId) ? prev : [...prev, commentId]
    );
  }, []);

  const handleCopyOrShare = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Clipboard fallback ignored
    }
    showToast('คัดลอกลิงก์กระทู้เรียบร้อยแล้ว');
  }, [showToast]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      showToast(
        next
          ? 'ปิดการแจ้งเตือนสำหรับกระทู้นี้แล้ว'
          : 'เปิดการแจ้งเตือนสำหรับกระทู้นี้แล้ว'
      );
      return next;
    });
  }, [showToast]);

  const handleReportSubmit = async (reason: ReportReason, details: string) => {
    const target = reportTarget;
    setReportTarget(null);
    if (!target) return;

    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนส่งรายงาน');
      return;
    }

    try {
      const result = await reportThreadTarget({
        roomId: room.id,
        postId: thread.id,
        messageId: target.id,
        reason,
        details,
      });
      if (!result.ok) {
        showToast(result.error);
        return;
      }
      showToast(
        target.type === 'comment'
          ? 'ส่งรายงานความคิดเห็นให้ทีมงานตรวจสอบเรียบร้อยแล้ว'
          : 'ส่งรายงานกระทู้ให้ทีมงานตรวจสอบเรียบร้อยแล้ว'
      );
    } catch {
      showToast('ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header
        notifications={currentUser?.notifications ?? 0}
        rooms={myRooms}
        alias={currentUser?.alias ?? 'ผู้เยี่ยมชม'}
      />
      <main className="w-full max-w-[760px] mx-auto px-4 sm:px-6 pt-6 pb-32 sm:pb-16 space-y-4 flex-1">
        {/* Back link */}
        <div>
          <Link
            href={`/rooms/${room.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-kmutt-orange-dark hover:underline"
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
          onReplyClick={handleReplyClick}
          onShareClick={handleCopyOrShare}
          onCopyLinkClick={handleCopyOrShare}
          onToggleMuteClick={handleToggleMute}
          onReportClick={handlePostReportClick}
        />

        {/* Reply Composer */}
        {canComment ? (
          <ReplyComposer
            currentUserName={currentUser?.alias ?? 'นิรนาม'}
            inputRef={mainReplyInputRef}
            onSubmit={handleAddTopLevelComment}
          />
        ) : (
          <div
            className={`${indexCardClass} p-4 flex items-center justify-between gap-3 flex-wrap`}
          >
            <p className="text-sm text-ink-soft">
              {disabledCommentNotice.message}
            </p>
            {disabledCommentNotice.showJoinLink && (
              <Link
                href={`/rooms/${room.slug}`}
                className={`h-8 px-3 ${outlineButtonClass} text-xs! sm:text-[13px]! inline-flex items-center`}
              >
                ไปที่หน้าห้องเพื่อเข้าร่วม
              </Link>
            )}
          </div>
        )}

        {/* Comments Header & Sort Dropdown */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <h2 className="font-display text-lg font-semibold">
            {totalComments} ความคิดเห็น
          </h2>

          <div ref={sortMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsSortMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isSortMenuOpen}
              className={`h-8 px-3 ${outlineButtonClass} text-xs! sm:text-[13px]! inline-flex items-center gap-2 cursor-pointer select-none`}
            >
              <span>{sortOrder === 'oldest' ? 'เก่าสุดก่อน' : 'ใหม่สุดก่อน'}</span>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className={`text-ink-soft motion-safe:transition-transform motion-safe:duration-200 ${
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
                className="absolute right-0 top-[calc(100%+4px)] z-20 w-[140px] rounded-[10px] border-[1.5px] border-ink bg-white p-1 shadow-sticker flex flex-col"
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
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs sm:text-[13px] cursor-pointer flex items-center justify-between hover:bg-butter ${
                        isSelected
                          ? 'bg-butter font-semibold text-ink'
                          : 'text-ink-soft hover:text-ink'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="text-ink shrink-0"
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
          className={`${indexCardClass} px-4 sm:px-6 py-2 divide-y divide-dashed divide-edge`}
        >
          {sortedComments.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">
              ยังไม่มีความคิดเห็น · มาเป็นคนแรกที่พูดคุยในกระทู้นี้กัน
            </p>
          ) : (
            sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                referenceTime={referenceTime}
                currentUserId={currentUser?.id ?? ''}
                currentUserName={currentUser?.alias ?? 'ผู้เยี่ยมชม'}
                isExpanded={expandedCommentIds.includes(comment.id)}
                isReplying={replyingTo?.commentId === comment.id}
                activeReplyTargetName={
                  replyingTo?.commentId === comment.id
                    ? replyingTo.targetName
                    : undefined
                }
                activeReplyTargetId={
                  replyingTo?.commentId === comment.id
                    ? replyingTo.targetReplyId
                    : undefined
                }
                onExpandReplies={handleExpandReplies}
                onToggleReaction={handleToggleCommentReaction}
                onStartReply={handleStartReply}
                onCancelReply={handleCancelReply}
                onSubmitReply={handleAddNestedReply}
                onEditComment={handleEditComment}
                onDeleteComment={handleRequestDeleteComment}
                onReportComment={handleReportComment}
              />
            ))
          )}
        </section>
      </main>

      {/* Delete Comment Confirmation Modal */}
      {pendingDeleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-ink/45 flex items-center justify-center p-4"
          onClick={() => setPendingDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-comment-title"
            onClick={(e) => e.stopPropagation()}
            className={`flex w-full max-w-sm flex-col gap-4 p-6 text-ink ${indexCardClass}`}
          >
            <div className="flex flex-col gap-1">
              <h3
                id="delete-comment-title"
                className="font-display text-xl font-semibold"
              >
                ลบความคิดเห็นนี้ไหม?
              </h3>
              <p className="text-sm text-ink-soft">
                {pendingDeleteTarget.descendantCount > 0
                  ? `ความคิดเห็นนี้และข้อความตอบกลับย่อยอีก ${pendingDeleteTarget.descendantCount} รายการจะถูกลบออกทั้งหมดและไม่สามารถกู้คืนได้`
                  : 'หากลบแล้ว ความคิดเห็นนี้จะหายไปและไม่สามารถกู้คืนได้'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteTarget(null)}
                className={`cursor-pointer px-4 py-2 ${outlineButtonClass}`}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeleteComment()}
                className={`cursor-pointer px-4 py-2 ${dangerButtonClass}`}
              >
                ลบความคิดเห็น
              </button>
            </div>
          </div>
        </div>
      )}

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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border-[1.5px] border-ink bg-butter px-4 py-3 text-sm font-medium shadow-sticker-lg motion-safe:animate-sheet-drop"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
