export type CommentSortOrder = 'oldest' | 'newest';

export type ReportTargetType = 'post' | 'comment';

export type ReportReason =
  | 'inappropriate'
  | 'spam'
  | 'misinformation'
  | 'other';

export interface ReactionItem {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface ThreadAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ThreadReply {
  id: string;
  author: ThreadAuthor;
  replyTo?: {
    id?: string;
    name: string;
  };
  isPostAuthor?: boolean;
  isEdited?: boolean;
  content: string;
  createdAt: string;
  reactions: ReactionItem[];
}

export interface ThreadComment {
  id: string;
  author: ThreadAuthor;
  isPostAuthor?: boolean;
  isEdited?: boolean;
  content: string;
  createdAt: string;
  reactions: ReactionItem[];
  replies: ThreadReply[];
  initialVisibleReplies?: number;
}

export interface PostThread {
  id: string;
  boardSlug: string;
  boardName: string;
  author: ThreadAuthor;
  content: string;
  createdAt: string;
  reactions: ReactionItem[];
  comments: ThreadComment[];
}

export interface PostThreadFeedResponse {
  thread: PostThread;
  currentUser: ThreadAuthor;
  serverTime: string;
}

export interface BoardPostSummary {
  id: string;
  roomId: string;
  authorId: string;
  author: string;
  createdAt?: string;
  createdAtOffsetMs: number;
  timeLabel: string;
  content: string;
  isEdited?: boolean;
  reactions: { emoji: string; count: number }[];
  replyCount: number;
}
