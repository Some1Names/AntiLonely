import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client.ts';
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
const ago = (ms: number) => new Date(now - ms);

const USERS = {
  testerOne: '11111111-1111-4111-8111-111111111111',
  testerTwo: '33333333-3333-4333-8333-333333333333',
  puayleng: '10000000-0000-4000-8000-000000000003',
  pakkad: '10000000-0000-4000-8000-000000000004',
  tonhom: '10000000-0000-4000-8000-000000000005',
  saifon: '10000000-0000-4000-8000-000000000006',
} as const;

const ROOMS = {
  lab: '22222222-2222-4222-8222-222222222222',
  songs: '20000000-0000-4000-8000-000000000002',
  teachers: '20000000-0000-4000-8000-000000000003',
} as const;

const SEED_USERS = [
  {
    id: USERS.testerOne,
    username: 'tester_one',
    displayUsername: 'คนทดสอบ',
    name: 'Tester One',
    email: 'tester1@example.com',
  },
  {
    id: USERS.testerTwo,
    username: 'tester_two',
    displayUsername: 'เพื่อนในห้อง',
    name: 'Tester Two',
    email: 'tester2@example.com',
  },
  {
    id: USERS.puayleng,
    username: 'puayleng',
    displayUsername: 'ปวยเล้ง',
    name: 'Puayleng',
    email: 'puayleng@example.com',
  },
  {
    id: USERS.pakkad,
    username: 'pakkad',
    displayUsername: 'ผักกาด',
    name: 'Pakkad',
    email: 'pakkad@example.com',
  },
  {
    id: USERS.tonhom,
    username: 'tonhom',
    displayUsername: 'ต้นหอม',
    name: 'Tonhom',
    email: 'tonhom@example.com',
  },
  {
    id: USERS.saifon,
    username: 'saifon',
    displayUsername: 'สายฝน',
    name: 'Saifon',
    email: 'saifon@example.com',
  },
] as const;

const SEED_ROOMS = [
  {
    id: ROOMS.lab,
    name: 'ห้องทดลอง Local Postgres',
    description: 'ห้องสำหรับทดสอบการดึงข้อมูลและ Server Actions จาก PostgreSQL จริง',
    rules: '1. ข้อมูลนี้มาจาก PostgreSQL จริง\n2. ไม่ใช้ mock fallback\n3. ใจดีต่อกันและเคารพพื้นที่ปลอดภัยของทุกคน',
    passwordHash: null,
    creatorId: USERS.testerOne,
  },
  {
    id: ROOMS.songs,
    name: 'บริจาคเพลง',
    description: 'ขอเพลงเศร้า ๆ จนผีในห้องบอกเปลี่ยนเพลงเถอะ เศร้าจนจะตายอีกรอบแล้ว',
    rules: '1. แปะชื่อเพลงและศิลปินให้ครบ จะได้ตามไปฟังง่าย ๆ\n2. ไม่สปอยล์หรือคอมเมนต์ทำร้ายความรู้สึกกัน\n3. ห้ามสแปมลิงก์โฆษณา',
    passwordHash: null,
    creatorId: USERS.puayleng,
  },
  {
    id: ROOMS.teachers,
    name: 'เม้าท์อาจารย์',
    description: 'พื้นที่ระบายเรื่องเรียน โปรเจกต์ และเดดไลน์ (ห้องส่วนตัว)',
    rules: '1. ไม่ระบุชื่อจริง-นามสกุลจริงของบุคคลที่สาม\n2. ห้ามแคปหน้าจอออกไปเผยแพร่ข้างนอก\n3. เน้นระบายและให้กำลังใจกัน',
    passwordHash: '$2b$10$seedplaceholderhashforprivateroomonly000000000000000',
    creatorId: USERS.tonhom,
  },
] as const;

const SEED_MEMBERS = [
  // Room 1: lab (4 active members matching all post/reply authors)
  { userId: USERS.testerOne, roomId: ROOMS.lab, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.testerTwo, roomId: ROOMS.lab, role: 'moderator' as const, status: 'active' as const },
  { userId: USERS.tonhom, roomId: ROOMS.lab, role: 'member' as const, status: 'active' as const },
  { userId: USERS.saifon, roomId: ROOMS.lab, role: 'member' as const, status: 'active' as const },

  // Room 2: songs (5 active members)
  { userId: USERS.puayleng, roomId: ROOMS.songs, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.pakkad, roomId: ROOMS.songs, role: 'member' as const, status: 'active' as const },
  { userId: USERS.tonhom, roomId: ROOMS.songs, role: 'member' as const, status: 'active' as const },
  { userId: USERS.saifon, roomId: ROOMS.songs, role: 'member' as const, status: 'active' as const },
  { userId: USERS.testerOne, roomId: ROOMS.songs, role: 'member' as const, status: 'active' as const },

  // Room 3: teachers (3 active members)
  { userId: USERS.tonhom, roomId: ROOMS.teachers, role: 'owner' as const, status: 'active' as const },
  { userId: USERS.puayleng, roomId: ROOMS.teachers, role: 'member' as const, status: 'active' as const },
  { userId: USERS.pakkad, roomId: ROOMS.teachers, role: 'member' as const, status: 'active' as const },
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

  // Room 2 (songs): 3 top-level posts + full multi-level thread comments & replies
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

  // Room 3 (teachers - private): 2 top-level posts + replies
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
    createdAt: ago(35 * MINUTE_MS),
  },
  {
    id: MSG.labPost3Reply1,
    roomId: ROOMS.lab,
    authorId: USERS.saifon,
    parentId: MSG.labPost3,
    content: 'ยังตื่นอยู่เหมือนกัน กำลังปั่นงานส่งพรุ่งนี้เลย',
    createdAt: ago(20 * MINUTE_MS),
  },
  {
    id: MSG.labPost3Reply1Child1,
    roomId: ROOMS.lab,
    authorId: USERS.tonhom,
    parentId: MSG.labPost3Reply1,
    content: 'สู้ ๆ นะ เสร็จแล้วอย่าลืมพักผ่อนเยอะ ๆ ล่ะ',
    createdAt: ago(10 * MINUTE_MS),
  },

  // --- Room 2: songs ---
  {
    id: MSG.songsPost1,
    roomId: ROOMS.songs,
    authorId: USERS.testerOne,
    parentId: null,
    content: 'ฝนตกไหม - Three Man Down',
    createdAt: ago(2 * HOUR_MS),
  },
  {
    id: MSG.songsPost1Comment1,
    roomId: ROOMS.songs,
    authorId: USERS.tonhom,
    parentId: MSG.songsPost1,
    content: 'เพลงนี้ฟังตอนฝนตกคือซึมจริง',
    createdAt: ago(1 * HOUR_MS + 40 * MINUTE_MS),
  },
  {
    id: MSG.songsPost1Comment1Reply1,
    roomId: ROOMS.songs,
    authorId: USERS.testerOne,
    parentId: MSG.songsPost1Comment1,
    content: 'จริงครับ เปิดวนไปยาว ๆ เลยคืนนี้',
    createdAt: ago(1 * HOUR_MS + 25 * MINUTE_MS),
  },
  {
    id: MSG.songsPost1Comment1Reply2,
    roomId: ROOMS.songs,
    authorId: USERS.saifon,
    parentId: MSG.songsPost1Comment1,
    content: 'อินโทรขึ้นมาก็เศร้าแล้ว',
    createdAt: ago(1 * HOUR_MS + 10 * MINUTE_MS),
  },
  {
    id: MSG.songsPost1Comment2,
    roomId: ROOMS.songs,
    authorId: USERS.pakkad,
    parentId: MSG.songsPost1,
    content: 'คิดถึงคนเก่าเลยเพลงนี้',
    createdAt: ago(45 * MINUTE_MS),
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

  // --- Room 3: teachers (private) ---
  {
    id: MSG.teachersPost1,
    roomId: ROOMS.teachers,
    authorId: USERS.tonhom,
    parentId: null,
    content: 'สั่งโปรเจกต์ใหม่คืนวันศุกร์ ส่งเช้าวันจันทร์ ใจจะขาดแล้ว',
    createdAt: ago(4 * HOUR_MS),
  },
  {
    id: MSG.teachersPost1Comment1,
    roomId: ROOMS.teachers,
    authorId: USERS.puayleng,
    parentId: MSG.teachersPost1,
    content: 'กอด ๆ นะ เจอเหมือนกันเลยสัปดาห์นี้',
    createdAt: ago(3 * HOUR_MS + 15 * MINUTE_MS),
  },
  {
    id: MSG.teachersPost1Comment1Reply1,
    roomId: ROOMS.teachers,
    authorId: USERS.tonhom,
    parentId: MSG.teachersPost1Comment1,
    content: 'ขอบคุณมาก รอดไปด้วยกันนะ!',
    createdAt: ago(2 * HOUR_MS + 50 * MINUTE_MS),
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

  // Room 2 (songs) posts & thread replies
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

  // Room 3 (teachers) posts & thread replies
  { messageId: MSG.teachersPost1, userId: USERS.puayleng, emojiType: '😭' },
  { messageId: MSG.teachersPost1, userId: USERS.pakkad, emojiType: '🫂' },
  { messageId: MSG.teachersPost1Comment1, userId: USERS.tonhom, emojiType: '🥹' },
] as const;

/** Idempotently seeds realistic users, public/private rooms, memberships, multi-level threads, and reactions. */
async function main() {
  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        displayUsername: user.displayUsername,
        name: user.name,
      },
      create: {
        ...user,
        emailVerified: true,
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
    seededRoomUrls.push({
      name: room.name,
      slug,
      isPrivate: Boolean(room.passwordHash),
    });

    await prisma.room.upsert({
      where: { id: room.id },
      update: {
        slug,
        name: room.name,
        description: room.description,
        rules: room.rules,
        passwordHash: room.passwordHash,
      },
      create: {
        ...room,
        slug,
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

  console.log(
    `Seeded ${SEED_USERS.length} users, ${SEED_ROOMS.length} rooms, ${SEED_MEMBERS.length} memberships, ${SEED_MESSAGES.length} messages/replies, ${SEED_REACTIONS.length} reactions.`
  );
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
