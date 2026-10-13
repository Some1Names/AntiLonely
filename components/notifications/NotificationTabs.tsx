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
    <div className="flex items-center gap-6 border-b border-zinc-200 overflow-x-auto no-scrollbar">
      {TABS.map((tab) => {
        const isActive = activeCategory === tab.id;
        const unreadCount = unreadCountsByCategory[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectCategory(tab.id)}
            className={`relative pb-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
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
  );
}
