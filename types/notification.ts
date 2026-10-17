export type NotificationCategory = 'all' | 'reply' | 'mention' | 'reaction' | 'report';

export type NotificationType = 'reply' | 'mention' | 'reaction' | 'report';

export interface NotificationActor {
  name: string;
  avatarUrl?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: NotificationActor;
  actionText: string;
  contentPreview?: string;
  createdAt: string; // ISO 8601 string, e.g. "2026-10-14T10:00:00.000Z"
  timeAgoText?: string;
  isRead: boolean;
  targetUrl: string;
}

export interface GroupedNotifications {
  recent: NotificationItem[];
  earlier: NotificationItem[];
}

export interface NotificationsFeedResponse {
  items: NotificationItem[];
  serverTime: string;
  unreadCountsByCategory?: Record<NotificationCategory, number>;
}
