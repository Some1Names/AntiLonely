"use server";

import { refresh } from "next/cache";
import { updateRoomMembership } from "@/app/rooms/[roomId]/actions";

export type HomeActionResult = { ok: true } | { ok: false; error: string };

// Joins or leaves a room from the home page. The room page's own action does
// the work and the checks; this adds a refresh so the cards, the member counts
// and "ห้องของฉัน" come back from the database in the same round trip.
export async function changeRoomMembership(input: {
  roomId: string;
  action: "join" | "leave";
}): Promise<HomeActionResult> {
  const result = await updateRoomMembership(input);
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}
