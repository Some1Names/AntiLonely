"use client";

import { useState } from "react";
import Icon from "@/component/Icon";
import { authClient } from "@/lib/auth-client";
import { outlineButtonClass } from "@/lib/styles";
import EditProfileModal, { type EditProfileResult } from "./EditProfileModal";

const AVATAR_SIZE = 256;

// ย่อรูปเป็นสี่เหลี่ยมจัตุรัส 256x256 แล้วแปลงเป็นข้อความ (data URL)
// เพื่อเก็บลงช่อง image ในฐานข้อมูล
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ย่อรูปไม่สำเร็จ");

  // พื้นขาวรองไว้ เผื่อรูป PNG ที่พื้นหลังโปร่งใส
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}

type Props = {
  initialName: string;
  initialImage?: string | null;
  onSaved: () => Promise<unknown>;
};

export default function EditProfileButton({
  initialName,
  initialImage,
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);

  async function handleSave({ name, image }: EditProfileResult) {
    const update: { name: string; image?: string | null } = { name };

    if (image === null) {
      update.image = null; // ลบรูป
    } else if (image) {
      update.image = await fileToAvatarDataUrl(image); // รูปใหม่
    }
    // image เป็น undefined = ไม่เปลี่ยนรูป ไม่ต้องส่งอะไร

    const { error } = await authClient.updateUser(update);
    if (error) throw new Error(error.message); // modal จะขึ้น "บันทึกไม่สำเร็จ"

    // โหลดข้อมูล User ล่าสุด
    await onSaved();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex shrink-0 items-center justify-center gap-1.5 self-start px-4 py-2 ${outlineButtonClass}`}
      >
        <Icon name="pencil" className="size-4" />
        แก้ไขโปรไฟล์
      </button>

      {open && (
        <EditProfileModal
          initialName={initialName}
          initialImage={initialImage}
          onClose={() => setOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}