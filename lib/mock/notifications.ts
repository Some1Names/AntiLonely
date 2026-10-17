import type {
  NotificationItem,
  NotificationsFeedResponse,
} from '@/types/notification';

export function getMockNotificationsFeed(
  referenceTime: number = Date.now()
): NotificationsFeedResponse {
  const items: NotificationItem[] = [
    {
      id: 'notif-1',
      type: 'reply',
      actor: {
        name: 'แมวส้มนอนดึก',
      },
      actionText: 'ตอบกระทู้ของคุณในห้องคุยเล่น',
      contentPreview: '“ปวดหลังเหมือนกันเลยพี่”',
      createdAt: new Date(referenceTime - 2 * 60 * 1000).toISOString(),
      isRead: false,
      targetUrl: '/boards/talk/posts/post-101',
    },
    {
      id: 'notif-2',
      type: 'mention',
      actor: {
        name: 'user_017',
      },
      actionText: 'กล่าวถึงคุณใน “Study Group”',
      contentPreview: '“@anon_884 can you share your notes from earlier?”',
      createdAt: new Date(referenceTime - 18 * 60 * 1000).toISOString(),
      isRead: false,
      targetUrl: '/boards/study/posts/post-102',
    },
    {
      id: 'notif-3',
      type: 'reply',
      actor: {
        name: 'user_882',
      },
      actionText: 'ตอบกระทู้ของคุณในห้องคุยเล่น',
      contentPreview: '“Same here, glad it\'s not just me”',
      createdAt: new Date(referenceTime - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      targetUrl: '/boards/talk/posts/post-103',
    },
    {
      id: 'notif-4',
      type: 'reaction',
      actor: {
        name: 'anon_331',
      },
      actionText: 'และอีก 3 คน ถูกใจโพสต์ของคุณใน “Random”',
      contentPreview: '“Just finished my first origami crane project!”',
      createdAt: new Date(referenceTime - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      targetUrl: '/boards/random/posts/post-104',
    },
    {
      id: 'notif-5',
      type: 'mention',
      actor: {
        name: 'anon_119',
      },
      actionText: 'กล่าวถึงคุณใน “General Chat”',
      contentPreview: '“Thanks @anon_884, that fixed it!”',
      createdAt: new Date(referenceTime - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      targetUrl: '/boards/general/posts/post-105',
    },
    {
      id: 'notif-6',
      type: 'report',
      actor: {
        name: 'ฝ่ายดูแลระบบ',
      },
      actionText: 'รายงานของคุณได้รับการตรวจสอบและดำเนินการแล้ว',
      contentPreview:
        '“ข้อความที่มีผู้ไม่หวังดีถูกระงับเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลพื้นที่ส่วนกลาง”',
      createdAt: new Date(referenceTime - 6 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      targetUrl: '/reports/rep-001',
    },
  ];

  return {
    items,
    serverTime: new Date(referenceTime).toISOString(),
  };
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] =
  getMockNotificationsFeed(Date.parse('2026-10-14T12:00:00.000Z')).items;
