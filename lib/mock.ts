// Placeholder data for the wireframe. Replace with real data once there is a backend.

export type Room = {
  id: string;
  name: string;
  description: string;
  members: number;
  postsToday: number;
  isPrivate: boolean;
  isNew: boolean;
};

export type MyRoom = {
  id: string;
  name: string;
  unread: number;
  isPrivate: boolean;
};

export const currentUser = {
  name: "test_1234",
  notifications: 3,
};

export const myRooms: MyRoom[] = [
  { id: "chat", name: "คุยเล่น", unread: 3, isPrivate: false },
  { id: "books", name: "อ่านหนังสือ", unread: 12, isPrivate: false },
  { id: "teachers", name: "เม้าท์อาจารย์", unread: 0, isPrivate: true },
  { id: "games", name: "เล่นเกมส์กัก", unread: 0, isPrivate: false },
];

export const recommendedRooms: Room[] = [
  {
    id: "chat",
    name: "คุยเล่น",
    description: "นอนไม่หลับ มาคุยหน่อย",
    members: 1200,
    postsToday: 48,
    isPrivate: false,
    isNew: false,
  },
  {
    id: "books",
    name: "อ่านหนังสือ",
    description: "หาเพื่อนอ่านหนังสือเตรียมสอบ",
    members: 96,
    postsToday: 12,
    isPrivate: false,
    isNew: false,
  },
  {
    id: "acs-leak",
    name: "ACS Leak",
    description: "ปดโหด",
    members: 24,
    postsToday: 3,
    isPrivate: true,
    isNew: true,
  },
  {
    id: "songs",
    name: "บริจาคเพลง",
    description:
      "ขอเพลงเศร้า ๆ จนพี่ในห้องนอกเปลี่ยนเพลงเถอะเศร้าจนจะตายอีกรอบแล้ว",
    members: 640,
    postsToday: 31,
    isPrivate: false,
    isNew: true,
  },
  {
    id: "games",
    name: "เล่นเกมส์กัก",
    description: "RoV, Call of Duty, Valorant, ...",
    members: 310,
    postsToday: 9,
    isPrivate: false,
    isNew: false,
  },
  {
    id: "teachers",
    name: "เม้าท์อาจารย์",
    description: "เรื่องลับๆที่คุณไม่เคยรู้เกี่ยวกับอาจารย์",
    members: 185,
    postsToday: 5,
    isPrivate: true,
    isNew: false,
  },
];
