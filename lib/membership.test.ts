import assert from "node:assert/strict";
import { test } from "node:test";
import {
  joinedRooms,
  joinRoom,
  leaveRoom,
  membershipFrom,
  membershipStatus,
  pickRandomRoom,
  roomsToDiscover,
} from "./membership.ts";
import type { MyRoom, Room } from "./mock.ts";

const chat: Room = {
  id: "chat",
  name: "คุยเล่น",
  description: "นอนไม่หลับ มาคุยหน่อย",
  members: 1200,
  postsToday: 48,
  isPrivate: false,
  isNew: false,
  emoji: "💬",
};

const books: Room = {
  id: "books",
  name: "อ่านหนังสือ",
  description: "หาเพื่อนอ่านหนังสือเตรียมสอบ",
  members: 96,
  postsToday: 12,
  isPrivate: false,
  isNew: false,
  emoji: "📚",
};

const leak: Room = {
  id: "acs-leak",
  name: "ACS Leak",
  description: "ปดโหด",
  members: 24,
  postsToday: 3,
  isPrivate: true,
  isNew: true,
  emoji: "🕵️",
};

const songs: Room = {
  id: "songs",
  name: "บริจาคเพลง",
  description: "ขอเพลงเศร้า ๆ",
  members: 640,
  postsToday: 31,
  isPrivate: false,
  isNew: true,
  emoji: "🎧",
};

const rooms = [chat, books, leak, songs];

const myChat: MyRoom = {
  id: "chat",
  name: "คุยเล่น",
  unread: 3,
  isPrivate: false,
  emoji: "💬",
};

const myBooks: MyRoom = {
  id: "books",
  name: "อ่านหนังสือ",
  unread: 12,
  isPrivate: false,
  emoji: "📚",
};

test("membershipFrom: the rooms you start in are joined, others have no status", () => {
  const membership = membershipFrom([myChat, myBooks]);
  assert.equal(membershipStatus(membership, "chat"), "joined");
  assert.equal(membershipStatus(membership, "books"), "joined");
  assert.equal(membershipStatus(membership, "songs"), null);
});

test("membershipStatus: ignores keys every object inherits", () => {
  const membership = membershipFrom([myChat]);
  assert.equal(membershipStatus(membership, "constructor"), null);
  assert.equal(membershipStatus(membership, "toString"), null);
});

test("joinRoom: a public room is joined straight away", () => {
  assert.equal(membershipStatus(joinRoom({}, songs), "songs"), "joined");
});

test("joinRoom: a private room only gets a request", () => {
  assert.equal(membershipStatus(joinRoom({}, leak), "acs-leak"), "requested");
});

test("joinRoom: leaves the previous state untouched", () => {
  const before = membershipFrom([myChat]);
  joinRoom(before, songs);
  assert.deepEqual(before, { chat: "joined" });
});

test("leaveRoom: forgets only that room", () => {
  const membership = leaveRoom(membershipFrom([myChat, myBooks]), "chat");
  assert.equal(membershipStatus(membership, "chat"), null);
  assert.equal(membershipStatus(membership, "books"), "joined");
});

test("leaveRoom: leaves the previous state untouched", () => {
  const before = membershipFrom([myChat]);
  leaveRoom(before, "chat");
  assert.deepEqual(before, { chat: "joined" });
});

test("roomsToDiscover: rooms you haven't joined or asked to join, in order", () => {
  const membership = { chat: "joined", "acs-leak": "requested" } as const;
  assert.deepEqual(
    roomsToDiscover(rooms, membership).map((room) => room.id),
    ["books", "songs"],
  );
});

test("pickRandomRoom: picks among the rooms you haven't joined or asked to join", () => {
  const membership = { chat: "joined", "acs-leak": "requested" } as const;
  assert.equal(pickRandomRoom(rooms, membership, undefined, () => 0)?.id, "books");
  assert.equal(pickRandomRoom(rooms, membership, undefined, () => 0.999)?.id, "songs");
});

test("pickRandomRoom: draws a different room from the one on screen", () => {
  const membership = { chat: "joined", books: "joined" } as const;
  assert.equal(pickRandomRoom(rooms, membership, "acs-leak", () => 0)?.id, "songs");
  assert.equal(pickRandomRoom(rooms, membership, "songs", () => 0.999)?.id, "acs-leak");
});

test("pickRandomRoom: shows the same room again when it's the only one left", () => {
  const membership = { chat: "joined", books: "joined", "acs-leak": "requested" } as const;
  assert.equal(pickRandomRoom(rooms, membership, "songs", () => 0)?.id, "songs");
});

test("pickRandomRoom: nothing to suggest once every room is joined or requested", () => {
  const membership = {
    chat: "joined",
    books: "joined",
    "acs-leak": "requested",
    songs: "joined",
  } as const;
  assert.equal(pickRandomRoom(rooms, membership, undefined, () => 0), null);
});

test("joinedRooms: keeps the rooms you started in, with their unread counts, until you leave", () => {
  const membership = leaveRoom(membershipFrom([myChat, myBooks]), "chat");
  assert.deepEqual(joinedRooms([myChat, myBooks], rooms, membership), [
    { id: "books", name: "อ่านหนังสือ", unread: 12, isPrivate: false, emoji: "📚" },
  ]);
});

test("joinedRooms: adds rooms joined later at the end, newest last, with nothing unread", () => {
  const membership = joinRoom(joinRoom(membershipFrom([myChat]), songs), books);
  assert.deepEqual(joinedRooms([myChat], rooms, membership), [
    { id: "chat", name: "คุยเล่น", unread: 3, isPrivate: false, emoji: "💬" },
    { id: "songs", name: "บริจาคเพลง", unread: 0, isPrivate: false, emoji: "🎧" },
    { id: "books", name: "อ่านหนังสือ", unread: 0, isPrivate: false, emoji: "📚" },
  ]);
});

test("joinedRooms: leaves out rooms you've only asked to join", () => {
  const membership = joinRoom(membershipFrom([myChat]), leak);
  assert.deepEqual(
    joinedRooms([myChat], rooms, membership).map((room) => room.id),
    ["chat"],
  );
});

test("joinedRooms: skips a joined room it has no details for", () => {
  const membership = joinRoom(membershipFrom([]), { id: "gone", isPrivate: false });
  assert.deepEqual(joinedRooms([], rooms, membership), []);
});
