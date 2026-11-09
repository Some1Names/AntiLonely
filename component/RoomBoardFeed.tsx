
"use client";

import Link from "next/link";
import { useState } from "react";
import EmptyNote from "@/component/EmptyNote";
import Header from "@/component/Header";
import Icon from "@/component/Icon";
import PostCard from "@/component/PostCard";
import Tape from "@/component/Tape";
import { currentUser, defaultRoomEmoji, myRooms, type Room } from "@/lib/mock";
import {
  avatarClass,
  highlightClass,
  indexCardClass,
  noteFieldClass,
  primaryButtonClass,
  roomLook,
} from "@/lib/styles";

type Post = {
  id: number;
  author: string;
  time: string;
  content: string;
  replyCount: number;
};

type Props = {
  room: Room;
};

export default function RoomBoardFeed({ room }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");

  // สีเงา เทป และพื้นหลังอิโมจิ ตามประเภทห้อง เหมือนการ์ดห้องในหน้าหลัก
  const look = roomLook(room);

  function handlePost() {
    if (text.trim() === "") return;

    const newPost: Post = {
      id: Date.now(),
      author: "user1",
      time: "เมื่อสักครู่",
      content: text,
      replyCount: 0,
    };

    setPosts((prev) => [newPost, ...prev]);
    setText("");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        notifications={currentUser.notifications}
        rooms={myRooms}
        alias={currentUser.alias}
      />

      {/* ส่วนหัวห้อง: การ์ดแปะเทปสีตามห้อง */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-6">
        <p className="mb-4 text-xs text-ink-soft">
          <Link
            href="/"
            className="font-semibold text-kmutt-orange-dark underline-offset-4 hover:underline"
          >
            หน้าหลัก
          </Link>{" "}
          / {room.name}
        </p>

        <div
          className={`relative flex items-start gap-4 rounded-xl border-[1.5px] border-ink bg-white p-5 pt-6 shadow-[4px_4px_0_var(--tone)] sm:p-6 ${look.card}`}
        >
          <Tape className={`h-5 w-16 ${look.tape}`} />
          <span
            aria-hidden="true"
            className={`flex size-14 shrink-0 items-center justify-center rounded-xl border-[1.5px] text-3xl ${look.tile}`}
          >
            {room.emoji ?? defaultRoomEmoji}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold leading-snug sm:text-3xl">
              <span className={highlightClass}>{room.name}</span>
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{room.description}</p>
          </div>
        </div>
      </section>

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-start gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* กล่องตั้งกระทู้: กระดาษโน้ตสีเหลืองแบบหน้าหลัก */}
          <div className="flex items-center gap-3 rounded-lg border-[1.5px] border-ink bg-butter p-4 shadow-sticker-lg">
            <span aria-hidden="true" className={`max-sm:hidden ${avatarClass}`}>
              <Icon name="user" className="size-4.5" />
            </span>

            <div className="relative min-w-0 flex-1">
              <Icon
                name="pencil"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-kmutt-yellow-dark"
              />
              <input
                aria-label="เนื้อหากระทู้"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
                placeholder="ตั้งกระทู้ในห้องนี้..."
                className={`py-2.5 pl-9 pr-3 ${noteFieldClass}`}
              />
            </div>

            <button
              type="button"
              onClick={handlePost}
              className={`shrink-0 px-4 py-2.5 ${primaryButtonClass}`}
            >
              ตั้งกระทู้
            </button>
          </div>

          {/* แสดงโพสต์ */}
          {posts.length === 0 && (
            <EmptyNote
              icon="message"
              title="ยังไม่มีกระทู้"
              description="มาตั้งกระทู้แรกกัน"
            />
          )}

          {posts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>

        {/* กติกาห้อง */}
        <aside className={`relative p-5 pt-6 ${indexCardClass}`}>
          <Tape />
          <h2 className="mb-3 border-b-[1.5px] border-dashed border-edge pb-2 font-display text-lg font-semibold">
            กติกาของห้อง
          </h2>

          <ol className="space-y-2 text-sm">
            <li>1. ใจดีต่อกัน เพราะหลังจอก็คือคนเหมือนกันน้า</li>
            <li>2. ไม่เปิดเผยข้อมูลส่วนตัวทั้งของตัวเองและของคนอื่น</li>
            <li>3. ไม่สแปม ไม่ขายของ</li>
            <li>4. เจอคนไม่น่ารัก กดรายงานดีกว่าตอบโต้นะ</li>
          </ol>
        </aside>
      </main>
    </div>
  );
}
