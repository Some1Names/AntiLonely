'use client';

import React, { useState, useMemo } from 'react';
import type { NotificationCategory } from '@/types/notification';
import {
  filterNotifications,
  groupNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  countUnreadNotifications,
} from '@/lib/notifications';
import { INITIAL_NOTIFICATIONS } from '@/lib/mock/notifications';
import { NotificationTabs } from '@/components/notifications/NotificationTabs';
import { NotificationSection } from '@/components/notifications/NotificationSection';
import { EmptyState } from '@/components/notifications/EmptyState';
import { NotificationSettingsButton } from '@/components/notifications/NotificationSettingsButton';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] =
    useState<NotificationCategory>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute unread counts per category for tab badges
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

  // Filter and group notifications for the current active tab
  const displayedNotifications = useMemo(() => {
    return filterNotifications(notifications, activeCategory);
  }, [notifications, activeCategory]);

  const grouped = useMemo(() => {
    return groupNotifications(displayedNotifications);
  }, [displayedNotifications]);

  const totalUnreadCount = unreadCountsByCategory.all;

  // Show a temporary toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Mark a single notification as read
  const handleItemClick = (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (target && !target.isRead) {
      setNotifications((prev) => markNotificationAsRead(prev, id));
    }
  };

  // Mark all notifications across the platform as read
  const handleMarkAllAsRead = () => {
    if (totalUnreadCount === 0) {
      showToast('ไม่มีรายการแจ้งเตือนที่ยังไม่ได้อ่าน');
      return;
    }
    setNotifications((prev) => markAllNotificationsAsRead(prev));
    showToast('ทำเครื่องหมายว่าอ่านแล้วทั้งหมดเรียบร้อยแล้ว');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans">
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Page Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              การแจ้งเตือน
            </h1>
            {totalUnreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-600">
                {totalUnreadCount} ใหม่
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={totalUnreadCount === 0}
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors cursor-pointer select-none ${
              totalUnreadCount > 0
                ? 'border-black text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200'
                : 'border-zinc-200 text-zinc-400 bg-zinc-50 cursor-not-allowed'
            }`}
          >
            ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
          </button>
        </header>

        {/* Filter Tabs */}
        <NotificationTabs
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          unreadCountsByCategory={unreadCountsByCategory}
        />

        {/* Notification Lists or Empty State */}
        <div className="space-y-6 pt-1">
          {displayedNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <NotificationSection
                title="ใหม่"
                items={grouped.recent}
                onItemClick={handleItemClick}
              />

              <NotificationSection
                title="ก่อนหน้านี้"
                items={grouped.earlier}
                onItemClick={handleItemClick}
              />
            </>
          )}
        </div>

        {/* Footer settings link */}
        <NotificationSettingsButton
          onClick={() => showToast('ลิงก์ไปยังหน้าตั้งค่าโปรไฟล์')}
        />
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
