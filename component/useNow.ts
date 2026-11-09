"use client";

import { useSyncExternalStore } from "react";

// เช็กเวลาใหม่ทุก 30 วินาที
function subscribe(callback: () => void) {
  const id = setInterval(callback, 30_000);
  return () => clearInterval(id);
}

// เวลาปัจจุบัน (ปัดเป็นนาที) อ่านเฉพาะในเบราว์เซอร์
// ฝั่งเซิร์ฟเวอร์จะได้ null
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 60000) * 60000,
    () => null,
  );
}