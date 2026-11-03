'use client';

import React from 'react';
import type { NotificationCategory } from '@/types/notification';

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
    <div className="relative border-b border-zinc-200">
      <div
        role="tablist"
        aria-label="ตัวกรองประเภทการแจ้งเตือน"
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden no-scrollbar pr-8 sm:pr-0 scroll-smooth"
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
              className={`relative pb-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                isActive
                  ? 'text-zinc-900 border-b-2 border-zinc-900 -mb-px'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span>{tab.label}</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-700">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subtle fade edge on right for mobile affordance */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#fafafa] to-transparent pointer-events-none sm:hidden" />
    </div>
  );
}
