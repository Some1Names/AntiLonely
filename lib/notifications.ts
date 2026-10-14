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

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function groupNotifications(
  notifications: NotificationItem[],
  now: number | Date = Date.now()
): GroupedNotifications {
  const nowMs = typeof now === 'number' ? now : now.getTime();

  return {
    recent: notifications.filter((item) => {
      const itemTime = new Date(item.createdAt).getTime();
      return !Number.isNaN(itemTime) && nowMs - itemTime < TWENTY_FOUR_HOURS_MS;
    }),
    earlier: notifications.filter((item) => {
      const itemTime = new Date(item.createdAt).getTime();
      return Number.isNaN(itemTime) || nowMs - itemTime >= TWENTY_FOUR_HOURS_MS;
    }),
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
