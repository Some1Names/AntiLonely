'use client';

import React from 'react';
import type { NotificationItem as NotificationItemType } from '@/types/notification';
import { formatTimeAgo } from '@/lib/notifications';

interface NotificationItemProps {
  notification: NotificationItemType;
  onClick: (id: string) => void;
  referenceTime?: number | Date;
}

export function NotificationItem({
  notification,
  onClick,
  referenceTime,
}: NotificationItemProps) {
  const {
    id,
    actor,
    badge,
    actionText,
    contentPreview,
    createdAt,
    timeAgoText,
    isRead,
    isImportant,
    systemIcon,
  } = notification;

  const displayedTime = timeAgoText ?? formatTimeAgo(createdAt, referenceTime);
  const isImportantUnread = Boolean(isImportant && !isRead);

  return (
    <div
      onClick={() => onClick(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(id);
        }
      }}
      className={`group flex items-start gap-3 p-4 sm:p-5 transition-colors cursor-pointer text-left ${
        isImportantUnread
          ? 'bg-[#FFF6F6] hover:bg-[#FEE2E2]/60'
          : 'bg-white hover:bg-zinc-50'
      }`}
    >
      {/* Unread indicator dot */}
      <div className="pt-2 flex-shrink-0 w-2.5 flex justify-center">
        {!isRead ? (
          <span
            className="w-2 h-2 rounded-full bg-red-500 shadow-xs"
            title="ยังไม่ได้อ่าน"
          >
            <span className="sr-only">ยังไม่ได้อ่าน</span>
          </span>
        ) : (
          <span className="w-2 h-2" />
        )}
      </div>

      {/* Avatar / Centered Team Icon */}
      {systemIcon === 'alert' || (isImportant && !actor.avatarUrl) ? (
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[#FEE2E2] text-[#B91C1C] select-none">
          <svg
            className="w-5 h-5 text-[#B91C1C]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
      ) : (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-200 select-none overflow-hidden flex items-center justify-center">
          {actor.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={actor.avatarUrl}
              alt={actor.name}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-sm text-zinc-900 leading-snug">
          <span className="font-semibold text-zinc-900">{actor.name}</span>{' '}
          <span className="text-zinc-800">{actionText}</span>
        </p>

        {contentPreview && (
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
            {contentPreview}
          </p>
        )}
      </div>

      {/* Time & Badge */}
      <div className="flex-shrink-0 flex flex-col items-end gap-2 pt-0.5 text-xs text-zinc-400 whitespace-nowrap">
        <span>{displayedTime}</span>
        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold select-none ${
              badge.variant === 'warning' || badge.variant === 'important'
                ? 'bg-[#FEE2E2] text-[#B91C1C]'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
