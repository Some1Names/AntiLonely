import type { ThreadComment, PostThreadFeedResponse } from '@/types/post-thread';

export interface BoardPostSummary {
  id: string;
  roomId: string;
  authorId: string;
  author: string;
  createdAtOffsetMs: number;
  timeLabel: string;
  content: string;
  reactions: { emoji: string; count: number }[];
  replyCount: number;
}

const BOARD_NAMES: Record<string, string> = {
  songs: 'ห้องบริจาคเพลง',
  chat: 'ห้องคุยเล่น',
  books: 'ห้องอ่านหนังสือ',
  'acs-leak': 'ห้อง ACS Leak',
  games: 'ห้องเล่นเกมส์กัก',
  teachers: 'ห้องเม้าท์อาจารย์',
  music: 'ห้องบริจาคเพลง',
  talk: 'ห้องคุยเล่น',
  study: 'ห้องติวหนังสือด้วยกัน',
};

const FIGMA_BOARD_POSTS: Omit<BoardPostSummary, 'roomId'>[] = [
  {
    id: 'board-1',
    authorId: 'user-platoo',
    author: 'ปลาทู',
    createdAtOffsetMs: 2 * 60 * 60 * 1000,
    timeLabel: '2 ชม. ที่แล้ว',
    content: 'ฝนตกไหม - Three Man Down',
    reactions: [
      { emoji: '😢', count: 6 },
      { emoji: '😭', count: 12 },
    ],
    replyCount: 4,
  },
  {
    id: 'board-2',
    authorId: 'user-puayleng',
    author: 'ปวยเล้ง',
    createdAtOffsetMs: 3 * 60 * 60 * 1000,
    timeLabel: '3 ชม. ที่แล้ว',
    content: 'นิโคติน - mirrr เศร้าแบบเกือบตาย',
    reactions: [
      { emoji: '😂', count: 5 },
      { emoji: '😭', count: 17 },
      { emoji: '😮', count: 6 },
    ],
    replyCount: 18,
  },
  {
    id: 'board-3',
    authorId: 'user-pakkad',
    author: 'ผักกาด',
    createdAtOffsetMs: 6 * 60 * 60 * 1000,
    timeLabel: '6 ชม. ที่แล้ว',
    content: 'รักไม่ได้ - Groove Riders',
    reactions: [
      { emoji: '😢', count: 13 },
      { emoji: '😮', count: 4 },
    ],
    replyCount: 0,
  },
];

export function getMockBoardPosts(roomId: string = 'songs'): BoardPostSummary[] {
  return FIGMA_BOARD_POSTS.map((post) => ({
    ...post,
    roomId,
    reactions: post.reactions.map((r) => ({ ...r })),
  }));
}

function buildCommentsForBoardPost(
  postId: string,
  postAuthor: { id: string; name: string },
  referenceTime: number
): ThreadComment[] {
  if (postId === 'board-3') {
    return [];
  }

  if (postId === 'board-1') {
    return [
      {
        id: 'comment-1',
        author: { id: 'anon-203', name: 'ต้นหอม' },
        isPostAuthor: false,
        content: 'เพลงนี้ฟังตอนฝนตกคือซึมจริง',
        createdAt: new Date(referenceTime - 60 * 60 * 1000).toISOString(),
        reactions: [{ emoji: '😢', count: 5, reactedByMe: false }],
        initialVisibleReplies: 1,
        replies: [
          {
            id: 'reply-1',
            author: postAuthor,
            isPostAuthor: true,
            content: 'จริงครับ เปิดวนไปยาวๆ เลยคืนนี้',
            createdAt: new Date(referenceTime - 55 * 60 * 1000).toISOString(),
            reactions: [{ emoji: '😭', count: 3, reactedByMe: false }],
          },
          {
            id: 'reply-2',
            author: { id: 'anon-512', name: 'สายฝน' },
            isPostAuthor: false,
            content: 'อินโทรขึ้นมาก็เศร้าแล้ว',
            createdAt: new Date(referenceTime - 48 * 60 * 1000).toISOString(),
            reactions: [{ emoji: '👍', count: 2, reactedByMe: false }],
          },
        ],
      },
      {
        id: 'comment-2',
        author: { id: 'anon-918', name: 'พริก' },
        isPostAuthor: false,
        content: 'คิดถึงคนเก่าเลยเพลงนี้',
        createdAt: new Date(referenceTime - 40 * 60 * 1000).toISOString(),
        reactions: [{ emoji: '😢', count: 2, reactedByMe: false }],
        replies: [],
      },
    ];
  }

  if (postId === 'board-2') {
    return [
      {
        id: 'comment-1',
        author: { id: 'anon-203', name: 'ต้นหอม' },
        isPostAuthor: false,
        content: 'ท่อนฮุคคือบาดลึกมาก',
        createdAt: new Date(referenceTime - 90 * 60 * 1000).toISOString(),
        reactions: [{ emoji: '😭', count: 8, reactedByMe: false }],
        initialVisibleReplies: 1,
        replies: [
          {
            id: 'reply-1',
            author: postAuthor,
            isPostAuthor: true,
            content: 'ฟังวนมาสิบกว่าทีแล้วเนี่ย',
            createdAt: new Date(referenceTime - 80 * 60 * 1000).toISOString(),
            reactions: [{ emoji: '😢', count: 4, reactedByMe: false }],
          },
        ],
      },
      {
        id: 'comment-2',
        author: { id: 'anon-512', name: 'สายฝน' },
        isPostAuthor: false,
        content: 'mirrr ทำเพลงเศร้าถึงใจทุกเพลงเลย',
        createdAt: new Date(referenceTime - 60 * 60 * 1000).toISOString(),
        reactions: [{ emoji: '👍', count: 5, reactedByMe: false }],
        replies: [],
      },
    ];
  }

  // Default / 'post-1' fixture
  return [
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
            id: 'user-platoo',
            name: 'ปลาทู',
          },
          replyTo: {
            id: 'anon-512',
            name: 'สายฝน',
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
  ];
}

export function getMockPostThread(
  boardSlug: string = 'songs',
  postId: string = 'post-1',
  referenceTime: number = Date.now()
): PostThreadFeedResponse {
  const boardName = BOARD_NAMES[boardSlug] ?? 'ห้องบริจาคเพลง';
  const matchedBoardPost = FIGMA_BOARD_POSTS.find((p) => p.id === postId);

  if (matchedBoardPost) {
    const postAuthor = {
      id: matchedBoardPost.authorId,
      name: matchedBoardPost.author,
    };

    return {
      currentUser: {
        id: 'user-platoo',
        name: 'ปลาทู',
      },
      serverTime: new Date(referenceTime).toISOString(),
      thread: {
        id: matchedBoardPost.id,
        boardSlug,
        boardName,
        author: postAuthor,
        content: matchedBoardPost.content,
        createdAt: new Date(
          referenceTime - matchedBoardPost.createdAtOffsetMs
        ).toISOString(),
        reactions: matchedBoardPost.reactions.map((r) => ({
          emoji: r.emoji,
          count: r.count,
          reactedByMe: false,
        })),
        comments: buildCommentsForBoardPost(
          matchedBoardPost.id,
          postAuthor,
          referenceTime
        ),
      },
    };
  }

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
      comments: buildCommentsForBoardPost(postId, postAuthor, referenceTime),
    },
  };
}
