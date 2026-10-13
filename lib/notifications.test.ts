import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterNotifications,
  groupNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  countUnreadNotifications,
} from './notifications.ts';
import type { NotificationItem } from '../types/notification.ts';

const sampleNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'reply',
    actor: { name: 'แมวส้มนอนดึก' },
    actionText: 'ตอบกระทู้ของคุณในห้องคุยเล่น',
    contentPreview: '“ปวดหลังเหมือนกันเลยพี่”',
    createdAt: '2026-10-13T09:10:00Z',
    timeAgoText: '2 นาที',
    isRead: false,
    targetUrl: '/boards/talk/posts/p1',
    isRecent: true,
  },
  {
    id: 'n2',
    type: 'mention',
    actor: { name: 'user_017' },
    actionText: 'กล่าวถึงคุณใน “Study Group”',
    contentPreview: '“@anon_884 can you share your notes?”',
    createdAt: '2026-10-13T08:50:00Z',
    timeAgoText: '18 นาที',
    isRead: false,
    targetUrl: '/boards/study/posts/p2',
    isRecent: true,
  },
  {
    id: 'n3',
    type: 'reaction',
    actor: { name: 'anon_999' },
    actionText: 'ถูกใจโพสต์ของคุณในห้องอ่านหนังสือ',
    createdAt: '2026-10-11T12:00:00Z',
    timeAgoText: '2 วันที่แล้ว',
    isRead: true,
    targetUrl: '/boards/study/posts/p3',
    isRecent: false,
  },
];

test('filterNotifications filters by category correctly', () => {
  const all = filterNotifications(sampleNotifications, 'all');
  assert.equal(all.length, 3);

  const replies = filterNotifications(sampleNotifications, 'reply');
  assert.equal(replies.length, 1);
  assert.equal(replies[0].id, 'n1');

  const mentions = filterNotifications(sampleNotifications, 'mention');
  assert.equal(mentions.length, 1);
  assert.equal(mentions[0].id, 'n2');

  const reports = filterNotifications(sampleNotifications, 'report');
  assert.equal(reports.length, 0);
});

test('groupNotifications partitions into recent and earlier', () => {
  const grouped = groupNotifications(sampleNotifications);
  assert.equal(grouped.recent.length, 2);
  assert.equal(grouped.earlier.length, 1);
  assert.equal(grouped.earlier[0].id, 'n3');
});

test('markNotificationAsRead updates only the targeted notification', () => {
  const updated = markNotificationAsRead(sampleNotifications, 'n1');
  assert.equal(updated.find((n) => n.id === 'n1')?.isRead, true);
  assert.equal(updated.find((n) => n.id === 'n2')?.isRead, false);
});

test('markAllNotificationsAsRead marks all as read', () => {
  const updated = markAllNotificationsAsRead(sampleNotifications);
  assert.ok(updated.every((n) => n.isRead));
});

test('countUnreadNotifications counts unread items', () => {
  assert.equal(countUnreadNotifications(sampleNotifications), 2);
});
