'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type {
  NotificationCategory,
  NotificationItem,
} from '@/types/notification';
import {
  filterNotifications,
  groupNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  countUnreadNotifications,
} from '@/lib/notifications';
import { NotificationTabs } from '@/components/notifications/NotificationTabs';
import { NotificationSection } from '@/components/notifications/NotificationSection';
import { EmptyState } from '@/components/notifications/EmptyState';

interface NotificationsClientProps {
  initialItems: NotificationItem[];
  serverTime: string;
}

export function NotificationsClient({
  initialItems,
  serverTime,
}: NotificationsClientProps) {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialItems);
  const [activeCategory, setActiveCategory] =
    useState<NotificationCategory>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const referenceTime = useMemo(
    () => new Date(serverTime).getTime(),
    [serverTime]
  );

  const unreadCountsByCategory = useMemo(() => {
    const categories: NotificationCategory[] = [
      'all',
      'reply',
      'mention',
      'reaction',
      'report',
    ];
    const counts: Record<NotificationCategory, number> = {
      all: 0,
      reply: 0,
      mention: 0,
      reaction: 0,
      report: 0,
    };

    categories.forEach((cat) => {
      const filtered = filterNotifications(notifications, cat);
      counts[cat] = countUnreadNotifications(filtered);
    });

    return counts;
  }, [notifications]);

  const displayedNotifications = useMemo(() => {
    return filterNotifications(notifications, activeCategory);
  }, [notifications, activeCategory]);

  const grouped = useMemo(() => {
    return groupNotifications(displayedNotifications, referenceTime);
  }, [displayedNotifications, referenceTime]);

  const totalUnreadCount = unreadCountsByCategory.all;

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const handleItemClick = (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (target && !target.isRead) {
      setNotifications((prev) => markNotificationAsRead(prev, id));
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => markAllNotificationsAsRead(prev));
    showToast('ทำเครื่องหมายว่าอ่านแล้วทั้งหมดเรียบร้อยแล้ว');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans">
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Header with Title and Mark all as read button */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              การแจ้งเตือน
            </h1>
          </div>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={totalUnreadCount === 0}
            className={`px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors select-none ${
              totalUnreadCount > 0
                ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200/70 cursor-pointer'
                : 'text-zinc-300 cursor-not-allowed'
            }`}
          >
            อ่านแล้วทั้งหมด
          </button>
        </header>

        {/* Category Filter Tabs */}
        <NotificationTabs
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          unreadCountsByCategory={unreadCountsByCategory}
        />

        {/* Notifications Grouped List or Empty State */}
        <div className="space-y-6 pt-1">
          {displayedNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <NotificationSection
                title="ใหม่"
                items={grouped.recent}
                onItemClick={handleItemClick}
                referenceTime={referenceTime}
              />

              <NotificationSection
                title="ก่อนหน้านี้"
                items={grouped.earlier}
                onItemClick={handleItemClick}
                referenceTime={referenceTime}
              />
            </>
          )}
        </div>
      </main>

      {/* Floating feedback toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg border border-zinc-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-emerald-400"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
