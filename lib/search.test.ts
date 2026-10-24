import assert from "node:assert/strict";
import { test } from "node:test";
import type { Room } from "./mock.ts";
import { roomMatchesQuery } from "./search.ts";

const games: Room = {
  id: "games",
  name: "เล่นเกมส์กัก",
  description: "RoV, Call of Duty, Valorant, ...",
  members: 310,
  postsToday: 9,
  isPrivate: false,
  isNew: false,
};

const leak: Room = {
  id: "acs-leak",
  name: "ACS Leak",
  description: "ปดโหด",
  members: 24,
  postsToday: 3,
  isPrivate: true,
  isNew: true,
};

const cases: { name: string; room: Room; query: string; want: boolean }[] = [
  { name: "empty query matches", room: games, query: "", want: true },
  { name: "spaces-only query matches", room: games, query: "   ", want: true },
  { name: "part of the name", room: games, query: "เกมส์", want: true },
  { name: "part of the description", room: leak, query: "ปดโหด", want: true },
  { name: "ignores case", room: games, query: "rov", want: true },
  { name: "ignores surrounding spaces", room: games, query: "  rov  ", want: true },
  { name: "squeezes inner spaces", room: leak, query: "acs   leak", want: true },
  { name: "text in neither field", room: games, query: "minecraft", want: false },
  { name: "id is not searched", room: leak, query: "acs-leak", want: false },
];

for (const { name, room, query, want } of cases) {
  test(`roomMatchesQuery: ${name}`, () => {
    assert.equal(roomMatchesQuery(room, query), want);
  });
}
