"use server";

import { refresh, revalidatePath } from "next/cache";
import {
  createRoomPost,
  updateRoomMembership,
} from "@/app/rooms/[roomId]/actions";
import { getMyRooms } from "@/lib/home-data";
import type { MyRoom } from "@/types/room";

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

export type PostResult =
  | { ok: true; postId: string }
  | { ok: false; error: string };

// Posts a thread from Home's welcome note or the create modal. The room
// page's action does the checks (signed in, joined, not muted, room not
// locked, length) and answers in Thai; this also marks Home stale so the
// room cards' post counts are fresh when you come back to it.
export async function postToRoom(input: {
  roomId: string;
  content: string;
}): Promise<PostResult> {
  const result = await createRoomPost(input);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/");
  return { ok: true, postId: result.data.id };
}

// The rooms you can post in, for the create modal on pages other than Home,
// whose own room lists may not come from the database.
export async function listMyRooms(): Promise<MyRoom[]> {
  return getMyRooms();
}
