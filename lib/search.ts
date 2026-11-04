import type { Room } from "@/lib/mock";

// Lower case with runs of spaces squeezed to one, so " RoV " and "rov" compare
// equal.
function normalize(text: string) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

// Only what's shown on the card is searched. An empty query matches every room.
export function roomMatchesQuery(room: Room, query: string) {
  const needle = normalize(query);
  return [room.name, room.description].some((text) =>
    normalize(text).includes(needle),
  );
}
