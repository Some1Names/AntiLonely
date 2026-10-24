'use client';

import React from 'react';
import type { ThreadComment } from '@/types/post-thread';
import { formatRelativeTimeThai } from '@/lib/post-thread';
import { ReactionBar } from '@/components/post-thread/ReactionBar';
import { ReplyComposer } from '@/components/post-thread/ReplyComposer';

interface CommentItemProps {
  comment: ThreadComment;
  referenceTime: number;
  currentUserName: string;
  isExpanded: boolean;
  isReplying: boolean;
  activeReplyTargetName?: string;
  onExpandReplies: (commentId: string) => void;
  onToggleReaction: (targetId: string, emoji: string) => void;
  onStartReply: (commentId: string, targetAuthorName: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (commentId: string, content: string) => void;
}

export function CommentItem({
  comment,
  referenceTime,
  currentUserName,
  isExpanded,
  isReplying,
  activeReplyTargetName,
  onExpandReplies,
  onToggleReaction,
  onStartReply,
  onCancelReply,
  onSubmitReply,
}: CommentItemProps) {
  const initialLimit = comment.initialVisibleReplies ?? comment.replies.length;
  const visibleReplies = isExpanded
    ? comment.replies
    : comment.replies.slice(0, initialLimit);
  const hiddenCount = Math.max(0, comment.replies.length - visibleReplies.length);

  return (
    <div className="py-3.5">
      {/* Top-level comment */}
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-[#d4d4d8] shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-semibold text-[#18181b]">
              {comment.author.name}
            </span>
            {comment.isPostAuthor && (
              <span className="inline-flex items-center rounded-full bg-[#18181b] px-2.5 py-0.5 text-[11px] font-medium text-white">
                เจ้าของกระทู้
              </span>
            )}
            <span className="text-xs text-[#71717a]">
              {formatRelativeTimeThai(comment.createdAt, referenceTime)}
            </span>
          </div>

          <p className="text-sm text-[#18181b] leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>

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
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm font-semibold text-[#18181b]">
                    {reply.author.name}
                  </span>
                  {reply.isPostAuthor && (
                    <span className="inline-flex items-center rounded-full bg-[#18181b] px-2.5 py-0.5 text-[11px] font-medium text-white">
                      เจ้าของกระทู้
                    </span>
                  )}
                  <span className="text-xs text-[#71717a]">
                    {formatRelativeTimeThai(reply.createdAt, referenceTime)}
                  </span>
                </div>

                <p className="text-sm text-[#18181b] leading-relaxed whitespace-pre-wrap break-words">
                  {reply.content}
                </p>

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
                    onClick={() => onStartReply(comment.id, reply.author.name)}
                    className="text-xs font-medium text-[#71717a] hover:text-[#18181b] transition-colors cursor-pointer select-none px-1"
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

