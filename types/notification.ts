export type NotificationCategory = 'all' | 'reply' | 'mention' | 'reaction' | 'report';

export type NotificationType = 'reply' | 'mention' | 'reaction' | 'report';

export interface NotificationActor {
  name: string;
  avatarUrl?: string;
}

export interface NotificationBadge {
  text: string;
  variant?: 'important' | 'warning' | 'default';
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: NotificationActor;
  badge?: NotificationBadge;
  actionText: string;
  contentPreview?: string;
  createdAt: string;
  isRead: boolean;
  targetUrl: string;
  isImportant?: boolean;
  systemIcon?: 'alert' | 'shield';
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
