'use client';

import React from 'react';
import type { NotificationCategory } from '@/types/notification';
import { stickerToggleClass } from '@/lib/styles';

interface NotificationTabsProps {
  activeCategory: NotificationCategory;
  onSelectCategory: (category: NotificationCategory) => void;
  unreadCountsByCategory: Record<NotificationCategory, number>;
}

const TABS: { id: NotificationCategory; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'reply', label: 'ตอบกลับ' },
  { id: 'mention', label: 'กล่าวถึง' },
  { id: 'reaction', label: 'รีแอคชัน' },
  { id: 'report', label: 'รายงาน' },
];

export function NotificationTabs({
  activeCategory,
  onSelectCategory,
  unreadCountsByCategory,
}: NotificationTabsProps) {
  return (
    <div className="relative">
      {/* Sticker chips, the chosen one pressed in. The padding (taken back by
          the negative margin) keeps their shadows and focus outlines from
          being clipped by the scroller. */}
      <div
        role="tablist"
        aria-label="ตัวกรองประเภทการแจ้งเตือน"
        className="-m-1.5 flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar p-1.5 pr-8 sm:pr-1.5 scroll-smooth"
      >
        {TABS.map((tab) => {
          const isActive = activeCategory === tab.id;
          const unreadCount = unreadCountsByCategory[tab.id];

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onSelectCategory(tab.id)}
              className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap px-3.5 py-1 ${stickerToggleClass}`}
            >
              <span>{tab.label}</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-kmutt-orange-dark px-1.5 text-xs font-semibold leading-5 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subtle fade edge on right for mobile affordance */}
      <div className="absolute -right-1.5 -top-1.5 -bottom-1.5 w-8 bg-linear-to-l from-cream to-transparent pointer-events-none sm:hidden" />
    </div>
  );
}
