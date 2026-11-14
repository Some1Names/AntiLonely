export type Room = {
  id: string;
  slug?: string;
  name: string;
  description: string;
  members: number;
  postsToday: number;
  totalPosts?: number;
  isPrivate: boolean;
  isNew: boolean;
  emoji?: string;
};

export type MyRoom = {
  id: string;
  slug?: string;
  name: string;
  unread: number;
  isPrivate: boolean;
  emoji?: string;
};
