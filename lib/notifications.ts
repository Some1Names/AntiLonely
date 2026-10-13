import type {
  GroupedNotifications,
  NotificationCategory,
  NotificationItem,
} from '@/types/notification';

export function filterNotifications(
  notifications: NotificationItem[],
  category: NotificationCategory
): NotificationItem[] {
  if (category === 'all') {
    return notifications;
  }
  return notifications.filter((item) => item.type === category);
}

export function groupNotifications(
  notifications: NotificationItem[]
): GroupedNotifications {
  return {
    recent: notifications.filter((item) => item.isRecent),
    earlier: notifications.filter((item) => !item.isRecent),
  };
}

export function markNotificationAsRead(
  notifications: NotificationItem[],
  id: string
): NotificationItem[] {
  return notifications.map((item) =>
    item.id === id ? { ...item, isRead: true } : item
  );
}

export function markAllNotificationsAsRead(
  notifications: NotificationItem[]
): NotificationItem[] {
  return notifications.map((item) => ({ ...item, isRead: true }));
}

export function countUnreadNotifications(
  notifications: NotificationItem[]
): number {
  return notifications.filter((item) => !item.isRead).length;
}
