import type {
  NotificationItem,
  NotificationsFeedResponse,
} from '@/types/notification';
import {
  MINUTE_MS,
  DAY_MS,
  RECENT_NOTIFICATION_WINDOW_MS,
} from '../notifications.ts';

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
      createdAt: new Date(referenceTime - 2 * MINUTE_MS).toISOString(),
      isRead: false,
      targetUrl: '/boards/talk/posts/post-101',
    },
    {
      id: 'notif-0',
      type: 'report',
      actor: {
        name: 'ฝ่ายดูแลระบบ',
      },
      badge: {
        text: 'สำคัญ',
        variant: 'important',
      },
      actionText: 'ได้ระงับโพสต์ของคุณเนื่องจากได้รับการรายงาน',
      contentPreview:
        '“โพสต์ของคุณในห้องคุยเล่นถูกรายงานว่าไม่เหมาะสมและถูกนำออกชั่วคราว หากมีข้อสงสัยสามารถติดต่อทีมงานได้”',
      createdAt: new Date(referenceTime - 5 * MINUTE_MS).toISOString(),
      isRead: false,
      targetUrl: '/reports/account-action-101',
      isImportant: true,
      systemIcon: 'alert',
    },
    {
      id: 'notif-2',
      type: 'mention',
      actor: {
        name: 'user_017',
      },
      actionText: 'กล่าวถึงคุณใน “Study Group”',
      contentPreview: '“@ปลาทู ขอโน้ตเมื่อกี้หน่อยได้ไหม”',
      createdAt: new Date(referenceTime - 18 * MINUTE_MS).toISOString(),
      isRead: false,
      targetUrl: '/boards/study/posts/post-102',
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
      createdAt: new Date(referenceTime - RECENT_NOTIFICATION_WINDOW_MS).toISOString(),
      isRead: true,
      targetUrl: '/reports/rep-001',
      systemIcon: 'shield',
    },
    {
      id: 'notif-4',
      type: 'reaction',
      actor: {
        name: '3 คน',
      },
      actionText: 'ส่งรีแอคชันให้กระทู้ของคุณในห้องคุยเล่น',
      contentPreview: '“ลองออกกำลังกายดูครับ เดี๋ยวก็หาย”',
      createdAt: new Date(referenceTime - 3 * DAY_MS).toISOString(),
      isRead: true,
      targetUrl: '/boards/talk/posts/post-104',
    },
    {
      id: 'notif-5',
      type: 'mention',
      actor: {
        name: 'ชาเย็นหวานน้อย',
      },
      actionText: 'กล่าวถึงคุณในห้องติวหนังสือด้วยกัน',
      contentPreview: '“@ปลาทู ฝากด้วยนะ ขอบคุณมาก”',
      createdAt: new Date(referenceTime - 5 * DAY_MS).toISOString(),
      isRead: true,
      targetUrl: '/boards/study/posts/post-105',
    },
  ];

  return {
    items,
    serverTime: new Date(referenceTime).toISOString(),
  };
}
