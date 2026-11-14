import assert from "node:assert/strict";
import { test } from "node:test";
import { ROOMS_PER_PAGE, nextRoomLimit, roomsToShow } from "./room-list.ts";

const rooms = (count: number) => Array.from({ length: count }, (_, i) => i);

test("roomsToShow: fewer rooms than a page shows them all, nothing more", () => {
  assert.deepEqual(roomsToShow(rooms(4), ROOMS_PER_PAGE), {
    visible: [0, 1, 2, 3],
    hasMore: false,
  });
});

test("roomsToShow: exactly a page has nothing more", () => {
  const { visible, hasMore } = roomsToShow(rooms(6), ROOMS_PER_PAGE);
  assert.equal(visible.length, 6);
  assert.equal(hasMore, false);
});

test("roomsToShow: one over a page shows the first page and more", () => {
  const { visible, hasMore } = roomsToShow(rooms(7), ROOMS_PER_PAGE);
  assert.deepEqual(visible, [0, 1, 2, 3, 4, 5]);
  assert.equal(hasMore, true);
});

test("roomsToShow: after one more press the 7th shows and nothing is left", () => {
  const { visible, hasMore } = roomsToShow(
    rooms(7),
    nextRoomLimit(ROOMS_PER_PAGE),
  );
  assert.equal(visible.length, 7);
  assert.equal(hasMore, false);
});

test("nextRoomLimit: each press adds a page", () => {
  assert.equal(nextRoomLimit(ROOMS_PER_PAGE), 12);
  assert.equal(nextRoomLimit(12), 18);
});

test("roomsToShow: no rooms", () => {
  assert.deepEqual(roomsToShow([], ROOMS_PER_PAGE), {
    visible: [],
    hasMore: false,
  });
});
