import type { NotificationItem } from '@/types/notification';

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'reply',
    actor: {
      name: 'แมวส้มนอนดึก',
    },
    actionText: 'ตอบกระทู้ของคุณในห้องคุยเล่น',
    contentPreview: '“ปวดหลังเหมือนกันเลยพี่”',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    timeAgoText: '2 นาที',
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
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    timeAgoText: '18 นาที',
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
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    timeAgoText: '1 วัน',
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
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    timeAgoText: '3 วัน',
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
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    timeAgoText: '5 วัน',
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
    contentPreview: '“ข้อความที่มีผู้ไม่หวังดีถูกระงับเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลพื้นที่ส่วนกลาง”',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    timeAgoText: '6 วัน',
    isRead: true,
    targetUrl: '/reports/rep-001',
  },
];
