'use client';

import React from 'react';
import type { NotificationItem as NotificationItemType } from '@/types/notification';
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
      <h2 className="text-sm font-semibold text-zinc-700 px-1">
        {title}
      </h2>
      <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-200 overflow-hidden shadow-xs">
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
