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
  if (Number.isNaN(nowMs)) {
    return { recent: [], earlier: [...notifications] };
  }

  // Sort descending by createdAt (newest first, NaN timestamps placed at the end)
  const sorted = [...notifications].sort((a, b) => {
    const timeA = Date.parse(a.createdAt);
    const timeB = Date.parse(b.createdAt);
    const validA = !Number.isNaN(timeA);
    const validB = !Number.isNaN(timeB);

    if (!validA && !validB) return 0;
    if (!validA) return 1;
    if (!validB) return -1;
    return timeB - timeA;
  });

  const pinned: NotificationItem[] = [];
  const recent: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  for (const item of sorted) {
    if (item.isImportant && !item.isRead) {
      pinned.push(item);
      continue;
    }

    const itemTime = Date.parse(item.createdAt);
    if (!Number.isNaN(itemTime) && nowMs - itemTime < TWENTY_FOUR_HOURS_MS) {
      recent.push(item);
    } else {
      earlier.push(item);
    }
  }

  return { recent: [...pinned, ...recent], earlier };
}

export function formatTimeAgo(
  dateString: string,
  now: number | Date = Date.now()
): string {
  const nowMs = typeof now === 'number' ? now : now.getTime();
  const itemTime = Date.parse(dateString);

  if (Number.isNaN(itemTime) || Number.isNaN(nowMs)) {
    return 'ไม่ระบุเวลา';
  }

  const diffMs = Math.max(0, nowMs - itemTime);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) {
    return 'เมื่อสักครู่';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} นาที`;
  }
  if (diffHours < 24) {
    return `${diffHours} ชั่วโมง`;
  }
  if (diffDays < 7) {
    return `${diffDays} วัน`;
  }
  return new Date(itemTime).toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
  });
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
