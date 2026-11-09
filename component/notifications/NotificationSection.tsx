'use client';

import React from 'react';
import type { NotificationItem as NotificationItemType } from '@/types/notification';
import { indexCardClass } from '@/lib/styles';
import { NotificationItem } from './NotificationItem';

interface NotificationSectionProps {
  title: string;
  items: NotificationItemType[];
  onItemClick: (id: string) => void;
  referenceTime?: number | Date;
}

export function NotificationSection({
  title,
  items,
  onItemClick,
  referenceTime,
}: NotificationSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="px-1 font-display text-lg font-semibold">
        {title}
      </h2>
      <div
        className={`divide-y-[1.5px] divide-dashed divide-edge overflow-hidden ${indexCardClass}`}
      >
        {items.map((item) => (
          <NotificationItem
            key={item.id}
            notification={item}
            onClick={onItemClick}
            referenceTime={referenceTime}
          />
        ))}
      </div>
    </section>
  );
}
