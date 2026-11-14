import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';
import { PrismaClient } from '../lib/generated/prisma/client.ts';
import { getStartOfBangkokDay } from '../lib/room-board.ts';
import { resolveUniqueRoomSlug } from '../lib/room-slug.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — copy .env.example to .env and fill it in.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const now = Date.now();
const startOfTodayMs = getStartOfBangkokDay(now).getTime();
const elapsedTodayMs = Math.max(0, now - startOfTodayMs);
const ago = (ms: number) => new Date(now - ms);
const todayAt = (fraction: number) =>
  new Date(startOfTodayMs + Math.round(elapsedTodayMs * fraction));

const DEV_ACCOUNT_PASSWORD = 'Antilonely123!';
const DEV_PRIVATE_ROOM_PASSWORD = 'antilonely-secret';

const USERS = {
  testerOne: '11111111-1111-4111-8111-111111111111',
  testerTwo: '33333333-3333-4333-8333-333333333333',
  puayleng: '10000000-0000-4000-8000-000000000003',
  pakkad: '10000000-0000-4000-8000-000000000004',
  tonhom: '10000000-0000-4000-8000-000000000005',
  saifon: '10000000-0000-4000-8000-000000000006',
  adminSeed: '10000000-0000-4000-8000-000000000007',
} as const;

const ROOMS = {
  lab: '22222222-2222-4222-8222-222222222222',
  chat: '20000000-0000-4000-8000-000000000001',
  songs: '20000000-0000-4000-8000-000000000002',
  teachers: '20000000-0000-4000-8000-000000000003',
  books: '20000000-0000-4000-8000-000000000004',
  acsLeak: '20000000-0000-4000-8000-000000000005',
  games: '20000000-0000-4000-8000-000000000006',
} as const;

const SEED_USERS = [
  {
    id: USERS.testerOne,
    accountId: 'a0000000-0000-4000-8000-000000000001',
    username: 'tester_one',
    displayUsername: 'คนทดสอบ',
    name: 'Tester One',
    email: 'tester1@example.com',
    role: 'user' as const,
  },
  {
    id: USERS.testerTwo,
    accountId: 'a0000000-0000-4000-8000-000000000002',
    username: 'tester_two',
    displayUsername: 'เพื่อนในห้อง',
    name: 'Tester Two',
    email: 'tester2@example.com',
    role: 'user' as const,
  },
  {
    id: USERS.puayleng,
    accountId: 'a0000000-0000-4000-8000-000000000003',
    username: 'puayleng',
    displayUsername: 'ปวยเล้ง',
    name: 'Puayleng',
    email: 'puayleng@example.com',
    role: 'user' as const,
  },
  {
    id: USERS.pakkad,
    accountId: 'a0000000-0000-4000-8000-000000000004',
    username: 'pakkad',
    displayUsername: 'ผักกาด',
    name: 'Pakkad',
    email: 'pakkad@example.com',
    role: 'user' as const,
  },
  {
    id: USERS.tonhom,
    accountId: 'a0000000-0000-4000-8000-000000000005',
    username: 'tonhom',
    displayUsername: 'ต้นหอม',
    name: 'Tonhom',
    email: 'tonhom@example.com',
    role: 'user' as const,
  },
  {
    id: USERS.saifon,
    accountId: 'a0000000-0000-4000-8000-000000000006',
    username: 'saifon',
    displayUsername: 'สายฝน',
    name: 'Saifon',
    email: 'saifon@example.com',
    role: 'user' as const,
  },
  {
    id: USERS.adminSeed,
    accountId: 'a0000000-0000-4000-8000-000000000007',
    username: 'admin_seed',
    displayUsername: 'แอดมิน',
    name: 'Admin Seed',
    email: 'admin@example.com',
    role: 'admin' as const,
  },
] as const;

const SEED_ROOMS = [
  {
    id: ROOMS.lab,
    name: 'ห้องทดลอง Local Postgres',
    description: 'ห้องสำหรับทดสอบการดึงข้อมูลและ Server Actions จาก PostgreSQL จริง',
    rules: '1. ข้อมูลนี้มาจาก PostgreSQL จริง\n2. ไม่ใช้ mock fallback\n3. ใจดีต่อกันและเคารพพื้นที่ปลอดภัยของทุกคน',
    isPrivate: false,
    creatorId: USERS.testerOne,
  },
  {
    id: ROOMS.chat,
    name: 'คุยเล่น',
    description: 'นอนไม่หลับ มาคุยหน่อย',
    rules: '1. คุยกันอย่างสุภาพและให้เกียรติกัน\n2. ไม่สแปมข้อความรัว ๆ\n3. เปิดรับทุกเรื่องสบาย ๆ ก่อนนอน',
    isPrivate: false,
    creatorId: USERS.testerOne,
  },
  {
    id: ROOMS.books,
    name: 'อ่านหนังสือ',
    description: 'หาเพื่อนอ่านหนังสือเตรียมสอบ',
    rules: '1. แชร์สรุป เทคนิคจำ หรือโจทย์ฝึกทำได้เต็มที่\n2. ชวนเพื่อนเข้าตี้ติวแบบสุภาพ\n3. ห้ามขายคอร์สหรือแปะลิงก์โฆษณา',
    isPrivate: false,
    creatorId: USERS.pakkad,
  },
  {
    id: ROOMS.acsLeak,
    name: 'ACS Leak',
    description: 'ปดโหด',
    rules: '1. คุยเฉพาะเรื่องในสาขาและประสบการณ์เรียน\n2. ห้ามโพสต์ข้อมูลส่วนตัวของผู้อื่น\n3. รักษาความเป็นส่วนตัวของสมาชิกในห้อง',
    isPrivate: true,
    creatorId: USERS.tonhom,
  },
  {
    id: ROOMS.songs,
    name: 'บริจาคเพลง',
    description: 'ขอเพลงเศร้า ๆ จนผีในห้องบอกเปลี่ยนเพลงเถอะ เศร้าจนจะตายอีกรอบแล้ว',
    rules: '1. แปะชื่อเพลงและศิลปินให้ครบ จะได้ตามไปฟังง่าย ๆ\n2. ไม่สปอยล์หรือคอมเมนต์ทำร้ายความรู้สึกกัน\n3. ห้ามสแปมลิงก์โฆษณา',
    isPrivate: false,
    creatorId: USERS.puayleng,
  },
  {
    id: ROOMS.games,
    name: 'เล่นเกมส์กัก',
    description: 'RoV, Call of Duty, Valorant, ...',
    rules: '1. นัดตี้ลงแรงก์หรือเล่นชิลได้ทุกเกม\n2. ไม่หัวร้อนใส่เพื่อนร่วมทีม\n3. แปะแรงก์และเวลาเล่นที่สะดวกให้ชัดเจน',
    isPrivate: false,
    creatorId: USERS.saifon,
  },
  {
    id: ROOMS.teachers,
    name: 'เม้าท์อาจารย์',
    description: 'เรื่องลับๆที่คุณไม่เคยรู้เกี่ยวกับอาจารย์',
    rules: '1. ไม่ระบุชื่อจริง-นามสกุลจริงของบุคคลที่สาม\n2. ห้ามแคปหน้าจอออกไปเผยแพร่ข้างนอก\n3. เน้นระบายและให้กำลังใจกัน',
    isPrivate: true,
    creatorId: USERS.tonhom,
  },
] as const;

const SEED_MEMBERS = [
  // Room 1: lab (4 active members matching all post/reply authors)
  { userId: USERS.testerOne, roomId: ROOMS.lab, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.testerTwo, roomId: ROOMS.lab, role: 'moderator' as const, status: 'active' as const },
  { userId: USERS.tonhom, roomId: ROOMS.lab, role: 'member' as const, status: 'active' as const },
  { userId: USERS.saifon, roomId: ROOMS.lab, role: 'member' as const, status: 'active' as const },

  // Room 2: chat (4 active members)
  { userId: USERS.testerOne, roomId: ROOMS.chat, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.testerTwo, roomId: ROOMS.chat, role: 'member' as const, status: 'active' as const },
  { userId: USERS.puayleng, roomId: ROOMS.chat, role: 'member' as const, status: 'active' as const },
  { userId: USERS.saifon, roomId: ROOMS.chat, role: 'member' as const, status: 'active' as const },

  // Room 3: books (4 active members)
  { userId: USERS.pakkad, roomId: ROOMS.books, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.testerOne, roomId: ROOMS.books, role: 'member' as const, status: 'active' as const },
  { userId: USERS.tonhom, roomId: ROOMS.books, role: 'member' as const, status: 'active' as const },
  { userId: USERS.puayleng, roomId: ROOMS.books, role: 'member' as const, status: 'active' as const },

  // Room 4: acs-leak (private; intentionally omits testerOne so private gate can be tested)
  { userId: USERS.tonhom, roomId: ROOMS.acsLeak, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.puayleng, roomId: ROOMS.acsLeak, role: 'member' as const, status: 'active' as const },
  { userId: USERS.pakkad, roomId: ROOMS.acsLeak, role: 'member' as const, status: 'active' as const },

  // Room 5: songs (5 active members)
  { userId: USERS.puayleng, roomId: ROOMS.songs, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.pakkad, roomId: ROOMS.songs, role: 'member' as const, status: 'active' as const },
  { userId: USERS.tonhom, roomId: ROOMS.songs, role: 'member' as const, status: 'active' as const },
  { userId: USERS.saifon, roomId: ROOMS.songs, role: 'member' as const, status: 'active' as const },
  { userId: USERS.testerOne, roomId: ROOMS.songs, role: 'member' as const, status: 'active' as const },

  // Room 6: games (4 active members)
  { userId: USERS.saifon, roomId: ROOMS.games, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.testerOne, roomId: ROOMS.games, role: 'member' as const, status: 'active' as const },
  { userId: USERS.testerTwo, roomId: ROOMS.games, role: 'member' as const, status: 'active' as const },
  { userId: USERS.pakkad, roomId: ROOMS.games, role: 'member' as const, status: 'active' as const },

  // Room 7: teachers (private; 4 active members including testerOne)
  { userId: USERS.tonhom, roomId: ROOMS.teachers, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.puayleng, roomId: ROOMS.teachers, role: 'member' as const, status: 'active' as const },
  { userId: USERS.pakkad, roomId: ROOMS.teachers, role: 'member' as const, status: 'active' as const },
  { userId: USERS.testerOne, roomId: ROOMS.teachers, role: 'member' as const, status: 'active' as const },
] as const;

const MSG = {
  // Room 1 (lab): 3 top-level posts + 4 comments + 2 nested replies
  labPost1: '44444444-4444-4444-8444-444444444444',
  labPost2: '55555555-5555-4555-8555-555555555555',
  labPost2Reply1: '66666666-6666-4666-8666-666666666666',
  labPost2Reply1Child1: '66666666-6666-4666-8666-666666666667',
  labPost2Reply2: '66666666-6666-4666-8666-666666666668',
  labPost3: '44444444-4444-4444-8444-444444444445',
  labPost3Reply1: '66666666-6666-4666-8666-666666666669',
  labPost3Reply1Child1: '66666666-6666-4666-8666-666666666670',

  // Room 2 (chat): 2 top-level posts + comments + nested reply
  chatPost1: '70000000-0000-4000-8000-000000000101',
  chatPost1Comment1: '70000000-0000-4000-8000-000000000111',
  chatPost1Comment1Reply1: '70000000-0000-4000-8000-000000000112',
  chatPost2: '70000000-0000-4000-8000-000000000201',

  // Room 3 (books): 2 top-level posts + comments + nested reply
  booksPost1: '80000000-0000-4000-8000-000000000101',
  booksPost1Comment1: '80000000-0000-4000-8000-000000000111',
  booksPost1Comment1Reply1: '80000000-0000-4000-8000-000000000112',
  booksPost2: '80000000-0000-4000-8000-000000000201',

  // Room 4 (acs-leak - private): 2 top-level posts + comment
  acsLeakPost1: '90000000-0000-4000-8000-000000000101',
  acsLeakPost1Comment1: '90000000-0000-4000-8000-000000000111',
  acsLeakPost2: '90000000-0000-4000-8000-000000000201',

  // Room 5 (songs): 3 top-level posts + full multi-level thread comments & replies
  songsPost1: '30000000-0000-4000-8000-000000000101',
  songsPost1Comment1: '30000000-0000-4000-8000-000000000111',
  songsPost1Comment1Reply1: '30000000-0000-4000-8000-000000000112',
  songsPost1Comment1Reply2: '30000000-0000-4000-8000-000000000113',
  songsPost1Comment2: '30000000-0000-4000-8000-000000000121',

  songsPost2: '30000000-0000-4000-8000-000000000201',
  songsPost2Comment1: '30000000-0000-4000-8000-000000000211',
  songsPost2Comment1Reply1: '30000000-0000-4000-8000-000000000212',
  songsPost2Comment2: '30000000-0000-4000-8000-000000000221',

  songsPost3: '30000000-0000-4000-8000-000000000301',

  // Room 6 (games): 2 top-level posts + comments + nested reply
  gamesPost1: 'b0000000-0000-4000-8000-000000000101',
  gamesPost1Comment1: 'b0000000-0000-4000-8000-000000000111',
  gamesPost1Comment1Reply1: 'b0000000-0000-4000-8000-000000000112',
  gamesPost2: 'b0000000-0000-4000-8000-000000000201',

  // Room 7 (teachers - private): 2 top-level posts + replies
  teachersPost1: '40000000-0000-4000-8000-000000000101',
  teachersPost1Comment1: '40000000-0000-4000-8000-000000000111',
  teachersPost1Comment1Reply1: '40000000-0000-4000-8000-000000000112',
  teachersPost2: '40000000-0000-4000-8000-000000000201',
} as const;

// Parents must appear before their children so FK parentId creation always succeeds.
const SEED_MESSAGES = [
  // --- Room 1: lab ---
  {
    id: MSG.labPost1,
    roomId: ROOMS.lab,
    authorId: USERS.testerOne,
    parentId: null,
    content: 'โพสต์แรกจากฐานข้อมูล PostgreSQL จริง!',
    createdAt: ago(2 * DAY_MS),
  },
  {
    id: MSG.labPost2,
    roomId: ROOMS.lab,
    authorId: USERS.testerTwo,
    parentId: null,
    content: 'โพสต์ที่สอง พร้อม reply และ reaction',
    createdAt: ago(3 * HOUR_MS),
  },
  {
    id: MSG.labPost2Reply1,
    roomId: ROOMS.lab,
    authorId: USERS.testerOne,
    parentId: MSG.labPost2,
    content: 'นี่คือคำตอบแรกใต้โพสต์ที่สอง',
    createdAt: ago(2 * HOUR_MS + 40 * MINUTE_MS),
  },
  {
    id: MSG.labPost2Reply1Child1,
    roomId: ROOMS.lab,
    authorId: USERS.tonhom,
    parentId: MSG.labPost2Reply1,
    content: 'และนี่คือ nested reply ซ้อนใต้คำตอบแรกครับ',
    createdAt: ago(2 * HOUR_MS + 25 * MINUTE_MS),
  },
  {
    id: MSG.labPost2Reply2,
    roomId: ROOMS.lab,
    authorId: USERS.saifon,
    parentId: MSG.labPost2,
    content: 'คำตอบที่สองในเธรดเดียวกัน ส่งกำลังใจให้นะ',
    createdAt: ago(2 * HOUR_MS),
  },
  {
    id: MSG.labPost3,
    roomId: ROOMS.lab,
    authorId: USERS.tonhom,
    parentId: null,
    content: 'คืนนี้นอนไม่หลับ ใครยังตื่นอยู่มาคุยกันในเธรดนี้ได้นะ',
    createdAt: todayAt(0.3),
  },
  {
    id: MSG.labPost3Reply1,
    roomId: ROOMS.lab,
    authorId: USERS.saifon,
    parentId: MSG.labPost3,
    content: 'ยังตื่นอยู่เหมือนกัน กำลังปั่นงานส่งพรุ่งนี้เลย',
    createdAt: todayAt(0.55),
  },
  {
    id: MSG.labPost3Reply1Child1,
    roomId: ROOMS.lab,
    authorId: USERS.tonhom,
    parentId: MSG.labPost3Reply1,
    content: 'สู้ ๆ นะ เสร็จแล้วอย่าลืมพักผ่อนเยอะ ๆ ล่ะ',
    createdAt: todayAt(0.8),
  },

  // --- Room 2: songs ---
  {
    id: MSG.songsPost1,
    roomId: ROOMS.songs,
    authorId: USERS.testerOne,
    parentId: null,
    content: 'ฝนตกไหม - Three Man Down',
    createdAt: todayAt(0.25),
  },
  {
    id: MSG.songsPost1Comment1,
    roomId: ROOMS.songs,
    authorId: USERS.tonhom,
    parentId: MSG.songsPost1,
    content: 'เพลงนี้ฟังตอนฝนตกคือซึมจริง',
    createdAt: todayAt(0.4),
  },
  {
    id: MSG.songsPost1Comment1Reply1,
    roomId: ROOMS.songs,
    authorId: USERS.testerOne,
    parentId: MSG.songsPost1Comment1,
    content: 'จริงครับ เปิดวนไปยาว ๆ เลยคืนนี้',
    createdAt: todayAt(0.55),
  },
  {
    id: MSG.songsPost1Comment1Reply2,
    roomId: ROOMS.songs,
    authorId: USERS.saifon,
    parentId: MSG.songsPost1Comment1,
    content: 'อินโทรขึ้นมาก็เศร้าแล้ว',
    createdAt: todayAt(0.7),
  },
  {
    id: MSG.songsPost1Comment2,
    roomId: ROOMS.songs,
    authorId: USERS.pakkad,
    parentId: MSG.songsPost1,
    content: 'คิดถึงคนเก่าเลยเพลงนี้',
    createdAt: todayAt(0.85),
  },
  {
    id: MSG.songsPost2,
    roomId: ROOMS.songs,
    authorId: USERS.puayleng,
    parentId: null,
    content: 'นิโคติน - mirrr เศร้าแบบเกือบตาย',
    createdAt: ago(5 * HOUR_MS),
  },
  {
    id: MSG.songsPost2Comment1,
    roomId: ROOMS.songs,
    authorId: USERS.tonhom,
    parentId: MSG.songsPost2,
    content: 'ท่อนฮุคคือบาดลึกมาก',
    createdAt: ago(4 * HOUR_MS + 30 * MINUTE_MS),
  },
  {
    id: MSG.songsPost2Comment1Reply1,
    roomId: ROOMS.songs,
    authorId: USERS.puayleng,
    parentId: MSG.songsPost2Comment1,
    content: 'เปิดตอนตีสองคือไม่ไหวจริง ๆ',
    createdAt: ago(4 * HOUR_MS),
  },
  {
    id: MSG.songsPost2Comment2,
    roomId: ROOMS.songs,
    authorId: USERS.saifon,
    parentId: MSG.songsPost2,
    content: 'ขออีกเพลงแนวเดียวกันได้ไหมครับ',
    createdAt: ago(3 * HOUR_MS + 20 * MINUTE_MS),
  },
  {
    id: MSG.songsPost3,
    roomId: ROOMS.songs,
    authorId: USERS.pakkad,
    parentId: null,
    content: 'รักไม่ได้ - Groove Riders',
    createdAt: ago(8 * HOUR_MS),
  },

  // --- Room 2: chat ---
  {
    id: MSG.chatPost1,
    roomId: ROOMS.chat,
    authorId: USERS.testerOne,
    parentId: null,
    content: 'ตีหนึ่งแล้วยังไม่หลับเลย มีใครอยู่เป็นเพื่อนคุยกันไหมคืนนี้',
    createdAt: todayAt(0.35),
  },
  {
    id: MSG.chatPost1Comment1,
    roomId: ROOMS.chat,
    authorId: USERS.puayleng,
    parentId: MSG.chatPost1,
    content: 'ยังอยู่จ้า กำลังฟังเพลงชิล ๆ อยู่เลย',
    createdAt: todayAt(0.6),
  },
  {
    id: MSG.chatPost1Comment1Reply1,
    roomId: ROOMS.chat,
    authorId: USERS.testerOne,
    parentId: MSG.chatPost1Comment1,
    content: 'ดีเลย อย่างน้อยคืนนี้ก็ไม่ได้นั่งมองเพดานคนเดียว',
    createdAt: todayAt(0.85),
  },
  {
    id: MSG.chatPost2,
    roomId: ROOMS.chat,
    authorId: USERS.saifon,
    parentId: null,
    content: 'พรุ่งนี้ฝนน่าจะตกอีกแล้ว อากาศน่านอนสุด ๆ',
    createdAt: ago(4 * HOUR_MS),
  },

  // --- Room 3: books ---
  {
    id: MSG.booksPost1,
    roomId: ROOMS.books,
    authorId: USERS.pakkad,
    parentId: null,
    content: 'ใครมีเทคนิคจำ SQL JOIN กับ Normalization ก่อนสอบมิดเทิร์นบ้าง ขอแชร์หน่อย',
    createdAt: todayAt(0.3),
  },
  {
    id: MSG.booksPost1Comment1,
    roomId: ROOMS.books,
    authorId: USERS.tonhom,
    parentId: MSG.booksPost1,
    content: 'ลองวาดเป็นตารางตัวอย่างสั้น ๆ แล้วไล่ทีละ 1NF -> 2NF -> 3NF ช่วยได้เยอะเลย',
    createdAt: todayAt(0.55),
  },
  {
    id: MSG.booksPost1Comment1Reply1,
    roomId: ROOMS.books,
    authorId: USERS.testerOne,
    parentId: MSG.booksPost1Comment1,
    content: 'จริงครับ พอเห็นภาพ Primary Key กับ Partial Dependency แล้วไม่งงเลย',
    createdAt: todayAt(0.8),
  },
  {
    id: MSG.booksPost2,
    roomId: ROOMS.books,
    authorId: USERS.puayleng,
    parentId: null,
    content: 'คืนนี้เปิดห้องอ่านหนังสือแบบ Pomodoro 50/10 ถึงเที่ยงคืนนะ มาสู้ไปด้วยกัน!',
    createdAt: ago(6 * HOUR_MS),
  },

  // --- Room 4: acs-leak (private) ---
  {
    id: MSG.acsLeakPost1,
    roomId: ROOMS.acsLeak,
    authorId: USERS.tonhom,
    parentId: null,
    content: 'ได้ข่าวว่าแล็บหน้ามีควิซย่อยต้นคาบ อย่าลืมทวนสไลด์บทที่ 4 กันนะทุกคน',
    createdAt: todayAt(0.4),
  },
  {
    id: MSG.acsLeakPost1Comment1,
    roomId: ROOMS.acsLeak,
    authorId: USERS.pakkad,
    parentId: MSG.acsLeakPost1,
    content: 'โอ๊ย ขอบคุณที่บอกทันเวลา เกือบไม่อ่านไปแล้ว!',
    createdAt: todayAt(0.75),
  },
  {
    id: MSG.acsLeakPost2,
    roomId: ROOMS.acsLeak,
    authorId: USERS.puayleng,
    parentId: null,
    content: 'ใครยังหาสมาชิกกลุ่มโปรเจกต์ไม่ครบ มาลงชื่อไว้ในเธรดนี้ได้นะ',
    createdAt: ago(9 * HOUR_MS),
  },

  // --- Room 6: games ---
  {
    id: MSG.gamesPost1,
    roomId: ROOMS.games,
    authorId: USERS.saifon,
    parentId: null,
    content: 'คืนนี้สี่ทุ่มขาดเมจ 1 ตำแหน่ง RoV ลงแรงก์แบบไม่หัวร้อน ใครว่างทักได้!',
    createdAt: todayAt(0.35),
  },
  {
    id: MSG.gamesPost1Comment1,
    roomId: ROOMS.games,
    authorId: USERS.testerOne,
    parentId: MSG.gamesPost1,
    content: 'เล่นได้ครับ ถนัด Krixi กับ Liliana ขอเข้าตี้ด้วยคน',
    createdAt: todayAt(0.6),
  },
  {
    id: MSG.gamesPost1Comment1Reply1,
    roomId: ROOMS.games,
    authorId: USERS.saifon,
    parentId: MSG.gamesPost1Comment1,
    content: 'จัดไป! เดี๋ยวใกล้สี่ทุ่มส่งรหัสห้องให้นะ',
    createdAt: todayAt(0.85),
  },
  {
    id: MSG.gamesPost2,
    roomId: ROOMS.games,
    authorId: USERS.testerTwo,
    parentId: null,
    content: 'มีใครเล่น Valorant เซิร์ฟสิงคโปร์ช่วงดึกไหม หาดูโอ้ชิล ๆ',
    createdAt: ago(7 * HOUR_MS),
  },

  // --- Room 7: teachers (private) ---
  {
    id: MSG.teachersPost1,
    roomId: ROOMS.teachers,
    authorId: USERS.tonhom,
    parentId: null,
    content: 'สั่งโปรเจกต์ใหม่คืนวันศุกร์ ส่งเช้าวันจันทร์ ใจจะขาดแล้ว',
    createdAt: todayAt(0.3),
  },
  {
    id: MSG.teachersPost1Comment1,
    roomId: ROOMS.teachers,
    authorId: USERS.puayleng,
    parentId: MSG.teachersPost1,
    content: 'กอด ๆ นะ เจอเหมือนกันเลยสัปดาห์นี้',
    createdAt: todayAt(0.55),
  },
  {
    id: MSG.teachersPost1Comment1Reply1,
    roomId: ROOMS.teachers,
    authorId: USERS.tonhom,
    parentId: MSG.teachersPost1Comment1,
    content: 'ขอบคุณมาก รอดไปด้วยกันนะ!',
    createdAt: todayAt(0.8),
  },
  {
    id: MSG.teachersPost2,
    roomId: ROOMS.teachers,
    authorId: USERS.pakkad,
    parentId: null,
    content: 'มีใครรู้บ้างว่าแล็บสัปดาห์หน้าเลื่อนส่งได้ไหม',
    createdAt: ago(1 * DAY_MS + 3 * HOUR_MS),
  },
] as const;

const SEED_REACTIONS = [
  // Room 1 (lab) posts & thread replies
  { messageId: MSG.labPost2, userId: USERS.testerOne, emojiType: '🫂' },
  { messageId: MSG.labPost2, userId: USERS.testerTwo, emojiType: '🫂' },
  { messageId: MSG.labPost2, userId: USERS.tonhom, emojiType: '🥹' },
  { messageId: MSG.labPost2Reply1, userId: USERS.testerTwo, emojiType: '👍' },
  { messageId: MSG.labPost2Reply1Child1, userId: USERS.testerOne, emojiType: '❤️' },
  { messageId: MSG.labPost3, userId: USERS.saifon, emojiType: '🫂' },
  { messageId: MSG.labPost3, userId: USERS.testerOne, emojiType: '🫂' },
  { messageId: MSG.labPost3Reply1, userId: USERS.tonhom, emojiType: '🔥' },

  // Room 2 (chat)
  { messageId: MSG.chatPost1, userId: USERS.puayleng, emojiType: '🫂' },
  { messageId: MSG.chatPost1, userId: USERS.saifon, emojiType: '🥹' },
  { messageId: MSG.chatPost1Comment1, userId: USERS.testerOne, emojiType: '❤️' },

  // Room 3 (books)
  { messageId: MSG.booksPost1, userId: USERS.testerOne, emojiType: '👍' },
  { messageId: MSG.booksPost1Comment1, userId: USERS.pakkad, emojiType: '🔥' },
  { messageId: MSG.booksPost2, userId: USERS.tonhom, emojiType: '🫂' },

  // Room 4 (acs-leak)
  { messageId: MSG.acsLeakPost1, userId: USERS.puayleng, emojiType: '😮' },
  { messageId: MSG.acsLeakPost1, userId: USERS.pakkad, emojiType: '😭' },

  // Room 5 (songs) posts & thread replies
  { messageId: MSG.songsPost1, userId: USERS.puayleng, emojiType: '🥹' },
  { messageId: MSG.songsPost1, userId: USERS.tonhom, emojiType: '🥹' },
  { messageId: MSG.songsPost1, userId: USERS.saifon, emojiType: '😭' },
  { messageId: MSG.songsPost1, userId: USERS.pakkad, emojiType: '😭' },
  { messageId: MSG.songsPost1Comment1, userId: USERS.testerOne, emojiType: '😢' },
  { messageId: MSG.songsPost1Comment1Reply1, userId: USERS.tonhom, emojiType: '😭' },
  { messageId: MSG.songsPost1Comment1Reply2, userId: USERS.pakkad, emojiType: '👍' },
  { messageId: MSG.songsPost2, userId: USERS.pakkad, emojiType: '😂' },
  { messageId: MSG.songsPost2, userId: USERS.tonhom, emojiType: '🥹' },
  { messageId: MSG.songsPost2, userId: USERS.saifon, emojiType: '😮' },
  { messageId: MSG.songsPost2Comment1, userId: USERS.puayleng, emojiType: '😭' },
  { messageId: MSG.songsPost3, userId: USERS.puayleng, emojiType: '🥹' },
  { messageId: MSG.songsPost3, userId: USERS.tonhom, emojiType: '😮' },

  // Room 6 (games)
  { messageId: MSG.gamesPost1, userId: USERS.testerOne, emojiType: '🔥' },
  { messageId: MSG.gamesPost1Comment1, userId: USERS.saifon, emojiType: '👍' },

  // Room 7 (teachers) posts & thread replies
  { messageId: MSG.teachersPost1, userId: USERS.puayleng, emojiType: '😭' },
  { messageId: MSG.teachersPost1, userId: USERS.pakkad, emojiType: '🫂' },
  { messageId: MSG.teachersPost1Comment1, userId: USERS.tonhom, emojiType: '🥹' },
] as const;

const SEED_NOTIFICATIONS = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    userId: USERS.testerOne,
    type: 'reply' as const,
    isRead: false,
    createdAt: ago(50 * MINUTE_MS),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    userId: USERS.testerOne,
    type: 'reaction' as const,
    isRead: false,
    createdAt: ago(1 * HOUR_MS + 35 * MINUTE_MS),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    userId: USERS.testerOne,
    type: 'mention' as const,
    isRead: true,
    createdAt: ago(1 * DAY_MS),
  },
] as const;

const SEED_REPORTS = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    reporterId: USERS.testerTwo,
    messageId: MSG.chatPost2,
    roomId: ROOMS.chat,
    reason: 'ตัวอย่างรายงานสำหรับทดสอบคิวตรวจสอบของผู้ดูแลระบบ (ข้อความยังคงแสดงปกติ)',
    status: 'pending' as const,
    createdAt: ago(2 * HOUR_MS),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000002',
    reporterId: USERS.pakkad,
    messageId: MSG.gamesPost2,
    roomId: ROOMS.games,
    reason: 'ตัวอย่างรายงานสแปมชวนเข้าห้องเกมสำหรับทดสอบหน้า Admin Reports',
    status: 'pending' as const,
    createdAt: ago(3 * HOUR_MS),
  },
] as const;

/** Idempotently seeds users/credentials, all Home & lab rooms, memberships, threads, reactions, notifications, and reports. */
async function main() {
  const [hashedUserPassword, hashedRoomPassword] = await Promise.all([
    hashPassword(DEV_ACCOUNT_PASSWORD),
    hashPassword(DEV_PRIVATE_ROOM_PASSWORD),
  ]);

  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        displayUsername: user.displayUsername,
        name: user.name,
        role: user.role,
      },
      create: {
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: true,
      },
    });

    await prisma.account.upsert({
      where: { id: user.accountId },
      update: {
        accountId: user.id,
        providerId: 'credential',
        password: hashedUserPassword,
        userId: user.id,
      },
      create: {
        id: user.accountId,
        accountId: user.id,
        providerId: 'credential',
        password: hashedUserPassword,
        userId: user.id,
      },
    });
  }

  const usedSlugs = new Set<string>();
  const seededRoomUrls: Array<{ name: string; slug: string; isPrivate: boolean }> = [];

  for (const room of SEED_ROOMS) {
    const slug = await resolveUniqueRoomSlug(
      room.name,
      async (candidate) => {
        if (usedSlugs.has(candidate)) return true;
        const existing = await prisma.room.findUnique({
          where: { slug: candidate },
          select: { id: true },
        });
        return existing !== null && existing.id !== room.id;
      },
      { deterministicKey: room.id }
    );
    usedSlugs.add(slug);

    const passwordHash = room.isPrivate ? hashedRoomPassword : null;
    seededRoomUrls.push({
      name: room.name,
      slug,
      isPrivate: room.isPrivate,
    });

    await prisma.room.upsert({
      where: { id: room.id },
      update: {
        slug,
        name: room.name,
        description: room.description,
        rules: room.rules,
        passwordHash,
      },
      create: {
        id: room.id,
        slug,
        name: room.name,
        description: room.description,
        rules: room.rules,
        passwordHash,
        creatorId: room.creatorId,
        status: 'active',
        isLocked: false,
      },
    });
  }

  for (const member of SEED_MEMBERS) {
    await prisma.roomMember.upsert({
      where: {
        userId_roomId: { userId: member.userId, roomId: member.roomId },
      },
      update: {
        role: member.role,
        status: member.status,
      },
      create: member,
    });
  }

  for (const message of SEED_MESSAGES) {
    await prisma.message.upsert({
      where: { id: message.id },
      update: {
        content: message.content,
        parentId: message.parentId,
        createdAt: message.createdAt,
        status: 'visible',
      },
      create: {
        ...message,
        status: 'visible',
      },
    });
  }

  for (const reaction of SEED_REACTIONS) {
    await prisma.reaction.upsert({
      where: {
        messageId_userId_emojiType: {
          messageId: reaction.messageId,
          userId: reaction.userId,
          emojiType: reaction.emojiType,
        },
      },
      update: {},
      create: reaction,
    });
  }

  for (const notification of SEED_NOTIFICATIONS) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: {
        type: notification.type,
        isRead: notification.isRead,
      },
      create: notification,
    });
  }

  for (const report of SEED_REPORTS) {
    await prisma.report.upsert({
      where: {
        reporterId_messageId: {
          reporterId: report.reporterId,
          messageId: report.messageId,
        },
      },
      update: {
        reason: report.reason,
        status: report.status,
      },
      create: report,
    });
  }

  console.log(
    `Seeded ${SEED_USERS.length} users (+credential accounts), ${SEED_ROOMS.length} rooms, ${SEED_MEMBERS.length} memberships, ${SEED_MESSAGES.length} messages/replies, ${SEED_REACTIONS.length} reactions, ${SEED_NOTIFICATIONS.length} notifications, ${SEED_REPORTS.length} reports.`
  );
  console.log(`Dev login password (all seeded users): ${DEV_ACCOUNT_PASSWORD}`);
  console.log(`Dev private room password (acs-leak, teachers): ${DEV_PRIVATE_ROOM_PASSWORD}`);
  console.log('Sample Room URLs:');
  for (const room of seededRoomUrls) {
    console.log(`  - ${room.name}${room.isPrivate ? ' (Private)' : ''}: /rooms/${room.slug}`);
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
