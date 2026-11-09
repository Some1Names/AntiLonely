import type { MyRoom, Room } from "@/lib/mock";

// Where you stand with each room: joined, or waiting on a request to join a
// private one. Rooms you have nothing to do with are left out. Keys keep the
// order rooms were joined in, which the sidebar shows newest last.
export type MembershipStatus = "joined" | "requested";
export type Membership = Readonly<Record<string, MembershipStatus>>;

// The rooms in "ห้องของฉัน" at the start are the ones you've joined.
export function membershipFrom(rooms: Pick<MyRoom, "id">[]): Membership {
  return Object.fromEntries(rooms.map((room) => [room.id, "joined" as const]));
}

// Own keys only, so an id such as "constructor" isn't read off the prototype.
export function membershipStatus(
  membership: Membership,
  roomId: string,
): MembershipStatus | null {
  return Object.hasOwn(membership, roomId) ? membership[roomId] : null;
}

// Joining a public room is instant; a private one gets a request instead.
export function joinRoom(
  membership: Membership,
  room: Pick<Room, "id" | "isPrivate">,
): Membership {
  return { ...membership, [room.id]: room.isPrivate ? "requested" : "joined" };
}

// Leaving a room, or taking back a request, forgets the room.
export function leaveRoom(membership: Membership, roomId: string): Membership {
  const next = { ...membership };
  delete next[roomId];
  return next;
}

// Rooms you could still join, in the order given.
export function roomsToDiscover<T extends Pick<Room, "id">>(
  rooms: T[],
  membership: Membership,
): T[] {
  return rooms.filter((room) => membershipStatus(membership, room.id) === null);
}

// A random room to suggest, never the one already on screen unless it's the
// only one left. Tests pass their own `random`.
export function pickRandomRoom<T extends Pick<Room, "id">>(
  rooms: T[],
  membership: Membership,
  currentId?: string,
  random: () => number = Math.random,
): T | null {
  const choices = roomsToDiscover(rooms, membership);
  const others = choices.filter((room) => room.id !== currentId);
  const pool = others.length > 0 ? others : choices;
  if (pool.length === 0) return null;
  return pool[Math.floor(random() * pool.length)];
}

// "ห้องของฉัน": the rooms you started in (with their unread counts) that you
// haven't left, then rooms joined since, newest last, with nothing unread.
export function joinedRooms(
  start: MyRoom[],
  rooms: Room[],
  membership: Membership,
): MyRoom[] {
  const startIds = new Set(start.map((room) => room.id));
  const kept = start.filter(
    (room) => membershipStatus(membership, room.id) === "joined",
  );
  const added = Object.keys(membership)
    .filter((id) => membership[id] === "joined" && !startIds.has(id))
    .flatMap((id) => {
      const room = rooms.find((candidate) => candidate.id === id);
      if (!room) return [];
      const { name, isPrivate, emoji } = room;
      return [{ id, name, unread: 0, isPrivate, emoji }];
    });
  return [...kept, ...added];
}
