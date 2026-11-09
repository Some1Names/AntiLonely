import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/component/Header";
import Paper from "@/component/Paper";
import { currentUser, myRooms } from "@/lib/mock";
import { highlightClass, primaryButtonClass } from "@/lib/styles";

export const metadata: Metadata = {
  title: "ไม่พบหน้านี้ | AntiLonely",
};

// Any URL the app doesn't have, and pages that call notFound() (such as a
// room id that doesn't exist): a taped sheet pointing back home.
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <Header
        notifications={currentUser.notifications}
        rooms={myRooms}
        alias={currentUser.alias}
      />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Paper className="w-full max-w-sm text-center">
          <p
            aria-hidden="true"
            className="font-display text-6xl font-semibold text-kmutt-orange"
          >
            404
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold">
            <span className={highlightClass}>หาหน้านี้ไม่เจอ</span>
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            ลิงก์อาจพิมพ์ผิด หรือหน้านี้ไม่มีอยู่แล้ว
            กลับไปเริ่มที่หน้าแรกกันนะ
          </p>
          <Link
            href="/"
            className={`mt-6 inline-flex px-5 py-2.5 ${primaryButtonClass}`}
          >
            กลับหน้าแรก
          </Link>
        </Paper>
      </main>
    </div>
  );
}
