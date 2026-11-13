export type Room = {
  id: string;
  name: string;
  description: string;
  members: number;
  postsToday: number;
  isPrivate: boolean;
  isNew: boolean;
  emoji?: string;
};

export type MyRoom = {
  id: string;
  name: string;
  unread: number;
  isPrivate: boolean;
  emoji?: string;
};
