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
  isRecent: boolean; // true for 'ใหม่' (recent), false for 'ก่อนหน้านี้' (earlier)
}

export interface GroupedNotifications {
  recent: NotificationItem[];
  earlier: NotificationItem[];
}
