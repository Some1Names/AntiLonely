import type { PostThreadFeedResponse } from '@/types/post-thread';

const BOARD_NAMES: Record<string, string> = {
  music: 'ห้องบริจาคเพลง',
  talk: 'ห้องคุยเล่น',
  study: 'ห้องติวหนังสือด้วยกัน',
};

export function getMockPostThread(
  boardSlug: string = 'music',
  postId: string = 'post-1',
  referenceTime: number = Date.now()
): PostThreadFeedResponse {
  const boardName = BOARD_NAMES[boardSlug] ?? 'ห้องบริจาคเพลง';
  const postAuthor = {
    id: 'user-op',
    name: 'เห็ดเกิดจากความเหงา',
  };

  return {
    currentUser: {
      id: 'user-platoo',
      name: 'ปลาทู',
    },
    serverTime: new Date(referenceTime).toISOString(),
    thread: {
      id: postId,
      boardSlug,
      boardName,
      author: postAuthor,
      content: 'ลบไม่ได้ช่วยให้ลืม พี่อิงค์ค้าบ',
      createdAt: new Date(referenceTime - 2 * 60 * 60 * 1000).toISOString(),
      reactions: [
        { emoji: '😣', count: 8, reactedByMe: false },
        { emoji: '😭', count: 17, reactedByMe: false },
      ],
      comments: [
        {
          id: 'comment-1',
          author: {
            id: 'anon-203',
            name: 'ต้นหอม',
          },
          isPostAuthor: false,
          content: 'เพลงพี่อิงค์เศร้าทุกเพลงจิง',
          createdAt: new Date(referenceTime - 60 * 60 * 1000).toISOString(),
          reactions: [{ emoji: '😢', count: 5, reactedByMe: false }],
          initialVisibleReplies: 1,
          replies: [
            {
              id: 'reply-1',
              author: postAuthor,
              isPostAuthor: true,
              content: '56565658845156',
              createdAt: new Date(referenceTime - 58 * 60 * 1000).toISOString(),
              reactions: [{ emoji: '😂', count: 4, reactedByMe: false }],
            },
            {
              id: 'reply-2',
              author: {
                id: 'anon-512',
                name: 'สายฝน',
              },
              isPostAuthor: false,
              content: 'จริงครับ ฟังทีไรน้ำตาซึมทุกที',
              createdAt: new Date(referenceTime - 50 * 60 * 1000).toISOString(),
              reactions: [{ emoji: '😭', count: 2, reactedByMe: false }],
            },
            {
              id: 'reply-3',
              author: {
                id: 'anon-619',
                name: 'หมูกรอบ',
              },
              isPostAuthor: false,
              content: 'แนะนำเพลง สายตาหลอกกันไม่ได้ อีกเพลงครับ',
              createdAt: new Date(referenceTime - 45 * 60 * 1000).toISOString(),
              reactions: [{ emoji: '👍', count: 3, reactedByMe: false }],
            },
          ],
        },
        {
          id: 'comment-2',
          author: {
            id: 'anon-918',
            name: 'พริก',
          },
          isPostAuthor: false,
          content: 'มีเพลงพี่อิงค์แนะนำอีกไหมคับ',
          createdAt: new Date(referenceTime - 40 * 60 * 1000).toISOString(),
          reactions: [{ emoji: '🤩', count: 2, reactedByMe: false }],
          replies: [],
        },
      ],
    },
  };
}
