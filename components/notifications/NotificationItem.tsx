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
  const { id, actor, actionText, contentPreview, createdAt, timeAgoText, isRead } =
    notification;

  const initial = actor.name ? actor.name.charAt(0) : '?';
  const displayedTime = timeAgoText ?? formatTimeAgo(createdAt, referenceTime);

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
      className="group flex items-start gap-3 p-4 sm:p-5 transition-colors cursor-pointer text-left bg-white hover:bg-zinc-50"
    >
      {/* Unread indicator dot */}
      <div className="pt-2 flex-shrink-0 w-2.5 flex justify-center">
        {!isRead ? (
          <span
            className="w-2 h-2 rounded-full bg-red-500 shadow-xs"
            title="ยังไม่ได้อ่าน"
          />
        ) : (
          <span className="w-2 h-2" />
        )}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-semibold text-sm select-none">
        {actor.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={actor.avatarUrl}
            alt={actor.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

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

      {/* Time */}
      <div className="flex-shrink-0 text-xs text-zinc-400 whitespace-nowrap pt-0.5">
        {displayedTime}
      </div>
    </div>
  );
}
