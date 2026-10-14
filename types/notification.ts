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
  createdAt: string;
  timeAgoText: string;
  isRead: boolean;
  targetUrl: string;
}

export interface GroupedNotifications {
  recent: NotificationItem[];
  earlier: NotificationItem[];
}
