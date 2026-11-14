// How many of Home's matching rooms to show: one page at first, then another
// page each time "ดูห้องเพิ่ม" is pressed.

export const ROOMS_PER_PAGE = 6;

// The first `limit` rooms, and whether any are left after them.
export function roomsToShow<T>(rooms: T[], limit: number) {
  return { visible: rooms.slice(0, limit), hasMore: rooms.length > limit };
}

// The limit after one more press of "ดูห้องเพิ่ม".
export function nextRoomLimit(limit: number) {
  return limit + ROOMS_PER_PAGE;
}
