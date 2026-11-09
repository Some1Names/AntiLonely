'use client';

import React from 'react';
import type { NotificationItem as NotificationItemType } from '@/types/notification';
import Icon from '@/component/Icon';
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
    isRead,
    isImportant,
    systemIcon,
  } = notification;

  const displayedTime = formatTimeAgo(createdAt, referenceTime);
  const isValidDate = !Number.isNaN(Date.parse(createdAt));
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
      // The list card clips its rows, so the focus ring is drawn inside.
      className={`group flex items-start gap-3 p-4 sm:p-5 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kmutt-orange-dark motion-safe:transition-colors ${
        isImportantUnread
          ? 'bg-peach/50 hover:bg-peach'
          : 'bg-white hover:bg-butter/60'
      }`}
    >
      {/* Unread indicator dot */}
      <div className="pt-2 flex-shrink-0 w-2.5 flex justify-center">
        {!isRead ? (
          <span
            className="size-2 rounded-full bg-kmutt-orange"
            title="ยังไม่ได้อ่าน"
          >
            <span className="sr-only">ยังไม่ได้อ่าน</span>
          </span>
        ) : (
          <span className="w-2 h-2" />
        )}
      </div>

      {/* Avatar / Centered Team Icon: a peach tile for warnings, a yellow
          sticker for the care team, otherwise a plain butter circle. */}
      {systemIcon === 'alert' || (isImportant && !actor.avatarUrl) ? (
        <div className="flex-shrink-0 size-10 rounded-full flex items-center justify-center border-[1.5px] border-peach-edge bg-peach text-kmutt-orange-dark select-none">
          <Icon name="alert" className="size-5" />
        </div>
      ) : systemIcon === 'shield' ? (
        <div className="flex-shrink-0 size-10 rounded-full flex items-center justify-center border-[1.5px] border-ink bg-kmutt-yellow text-ink shadow-sticker select-none">
          <Icon name="shield" className="size-5" />
        </div>
      ) : (
        <div className="flex-shrink-0 size-10 rounded-full border-[1.5px] border-butter-edge bg-butter select-none overflow-hidden flex items-center justify-center">
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
        <p className="text-sm leading-snug">
          <span className="font-semibold">{actor.name}</span>{' '}
          <span>{actionText}</span>
        </p>

        {contentPreview && (
          <p className="text-sm text-ink-soft mt-1 line-clamp-2 leading-relaxed">
            {contentPreview}
          </p>
        )}
      </div>

      {/* Time & Badge */}
      <div className="flex-shrink-0 flex flex-col items-end gap-2 pt-0.5 text-xs text-ink-soft whitespace-nowrap">
        <time dateTime={isValidDate ? createdAt : undefined}>
          {displayedTime}
        </time>
        {badge && (
          <span
            className={`inline-flex items-center px-2 rounded-full text-xs leading-5 font-semibold select-none ${
              badge.variant === 'warning' || badge.variant === 'important'
                ? 'bg-peach text-kmutt-orange-dark'
                : 'bg-mist text-mist-ink'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
