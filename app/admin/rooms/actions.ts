
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkRoomPermission() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user.role;

  if (!session || (role !== "admin" && role !== "moderator")) {
    return {
      ok: false as const,
      error: "คุณไม่มีสิทธิ์จัดการห้องแชท",
    };
  }

  return { ok: true as const };
}

export async function updateRoom(
  id: string,
  data: { name: string; description: string }
) {
  const permission = await checkRoomPermission();

  if (!permission.ok) return permission;

  const name = data.name.trim();
  const description = data.description.trim();

  if (!id || !name) {
    return {
      ok: false as const,
      error: "กรุณากรอกชื่อห้อง",
    };
  }

  try {
    const result = await prisma.room.updateMany({
      where: {
        id,
        status: { not: "archived" },
      },
      data: {
        name,
        description,
      },
    });

    if (result.count === 0) {
      return {
        ok: false as const,
        error: "ไม่พบห้อง หรือห้องนี้ถูกจัดเก็บแล้ว",
      };
    }

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");

    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "ไม่สามารถแก้ไขห้องได้ กรุณาลองใหม่",
    };
  }
}

export async function archiveRoom(id: string) {
  const permission = await checkRoomPermission();

  if (!permission.ok) return permission;

  if (!id) {
    return {
      ok: false as const,
      error: "ไม่พบรหัสห้อง",
    };
  }

  try {
    const result = await prisma.room.updateMany({
      where: {
        id,
        status: { not: "archived" },
      },
      data: {
        status: "archived",
      },
    });

    if (result.count === 0) {
      return {
        ok: false as const,
        error: "ไม่พบห้อง หรือห้องนี้ถูกจัดเก็บแล้ว",
      };
    }

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");

    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "ไม่สามารถจัดเก็บห้องได้ กรุณาลองใหม่",
    };
  }
}
