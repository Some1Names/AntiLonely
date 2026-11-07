
"use client";

import { useState } from "react";
import Header from "@/component/BoardHeader";
import PostCard from "@/component/PostCard";
import type { Room } from "@/lib/mock";

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
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ส่วนหัวห้อง */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="mb-4 text-xs text-gray-500">
            หน้าหลัก / {room.name}
          </p>

          <h1 className="mb-2 text-3xl font-bold">
            {room.name}
          </h1>

          <p className="text-sm text-gray-500">
            {room.description}
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl grid-cols-[1fr_320px] gap-8 px-6 py-6">
        <div className="space-y-4">
          {/* กล่องตั้งกระทู้ */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="h-9 w-9 rounded-full bg-gray-300" />

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePost()}
              placeholder="ตั้งกระทู้ในห้องนี้..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />

            <button
              onClick={handlePost}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              ตั้งกระทู้
            </button>
          </div>

          {/* แสดงโพสต์ */}
          {posts.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              ยังไม่มีกระทู้ มาตั้งกระทู้แรกกัน
            </p>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>

        {/* กติกาห้อง */}
        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-bold">กติกาของห้อง</h2>

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
