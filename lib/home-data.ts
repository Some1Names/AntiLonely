import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ROOM_EMOJI,
  getStartOfBangkokDay,
  NEW_ROOM_WINDOW_DAYS,
  resolveAuthorAlias,
} from "@/lib/room-board";
import { getViewerUser } from "@/lib/server-action-helpers";
import type { MyRoom, Room } from "@/types/room";

const DAY_MS = 24 * 60 * 60 * 1000;

export type HomeViewer = {
  // The nickname shown in the welcome note.
  name: string;
  // The name posts go out under.
  alias: string;
  // Unread notifications, for the bell.
  notifications: number;
};

export type HomeData = {
  // Every active room, busiest first.
  rooms: Room[];
  // The rooms the viewer has joined, newest last. Empty when signed out.
  myRooms: MyRoom[];
  // Null when nobody is signed in (or the account is suspended or banned).
  viewer: HomeViewer | null;
};

// Everything the home page shows, read from the database for this request.
export async function getHomeData(): Promise<HomeData> {
  const viewer = await getViewerUser();
  const now = Date.now();
  // A post is a top-level message; replies have a parent.
  const visiblePost = { status: "visible", parentId: null } as const;

  const [roomRows, postsTodayRows, memberships, notifications] =
    await Promise.all([
      prisma.room.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          passwordHash: true,
          createdAt: true,
          _count: {
            select: {
              members: { where: { status: "active" } },
              messages: { where: visiblePost },
            },
          },
        },
      }),
      prisma.message.groupBy({
        by: ["roomId"],
        where: {
          ...visiblePost,
          createdAt: { gte: getStartOfBangkokDay(now) },
          room: { status: "active" },
        },
        _count: { _all: true },
      }),
      viewer
        ? prisma.roomMember.findMany({
            where: {
              userId: viewer.id,
              status: "active",
              room: { status: "active" },
            },
            orderBy: { joinedAt: "asc" },
            select: { roomId: true },
          })
        : [],
      viewer
        ? prisma.notification.count({
            where: { userId: viewer.id, isRead: false },
          })
        : 0,
    ]);

  const postsToday = new Map(
    postsTodayRows.map((row) => [row.roomId, row._count._all]),
  );

  // The password hash stays here: the page only learns whether there is one.
  const rooms: Room[] = roomRows
    .map((room) => ({
      id: room.id,
      slug: room.slug,
      name: room.name,
      description: room.description,
      members: room._count.members,
      postsToday: postsToday.get(room.id) ?? 0,
      totalPosts: room._count.messages,
      isPrivate: Boolean(room.passwordHash),
      isNew: now - room.createdAt.getTime() <= NEW_ROOM_WINDOW_DAYS * DAY_MS,
      emoji: DEFAULT_ROOM_EMOJI,
    }))
    // Stable sort, so rooms with the same number of members stay oldest first.
    .sort((a, b) => b.members - a.members);

  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const myRooms: MyRoom[] = memberships.flatMap(({ roomId }) => {
    const room = roomsById.get(roomId);
    if (!room) return [];
    const { id, slug, name, isPrivate, emoji } = room;
    // Nothing records what's been read in a room yet, so nothing is unread.
    return [{ id, slug, name, unread: 0, isPrivate, emoji }];
  });

  return {
    rooms,
    myRooms,
    viewer: viewer
      ? {
          name: viewer.name,
          alias: resolveAuthorAlias(viewer),
          notifications,
        }
      : null,
  };
}

// The rooms the signed-in person has joined and can post in, for the create
// modal on pages that don't have Home's list. Empty when signed out.
export async function getMyRooms(): Promise<MyRoom[]> {
  const viewer = await getViewerUser();
  if (!viewer) return [];
  const memberships = await prisma.roomMember.findMany({
    where: {
      userId: viewer.id,
      status: "active",
      room: { status: "active" },
    },
    orderBy: { joinedAt: "asc" },
    select: {
      room: {
        select: { id: true, slug: true, name: true, passwordHash: true },
      },
    },
  });
  return memberships.map(({ room }) => ({
    id: room.id,
    slug: room.slug,
    name: room.name,
    unread: 0,
    isPrivate: Boolean(room.passwordHash),
    emoji: DEFAULT_ROOM_EMOJI,
  }));
}
