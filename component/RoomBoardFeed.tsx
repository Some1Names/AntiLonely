"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/component/Header";
import PostCard from "@/component/PostCard";
import { formatCount } from "@/lib/format";
import { currentUser, myRooms, type Room } from "@/lib/mock";
import {
  getMockBoardPosts,
  type BoardPostSummary,
} from "@/lib/mock/post-thread";

type Props = {
  room: Room;
};

export default function RoomBoardFeed({ room }: Props) {
  const [posts, setPosts] = useState<BoardPostSummary[]>(() =>
    getMockBoardPosts(room.id)
  );
  const [text, setText] = useState("");
  const [isJoined, setIsJoined] = useState<boolean>(() =>
    myRooms.some((r) => r.id === room.id) || room.id === "songs"
  );

  function handlePost() {
    if (text.trim() === "") return;

    const newPost: BoardPostSummary = {
      id: `post-${Date.now()}`,
      roomId: room.id,
      authorId: "user-platoo",
      author: currentUser.alias,
      createdAtOffsetMs: 0,
      timeLabel: "เมื่อสักครู่",
      content: text.trim(),
      reactions: [],
      replyCount: 0,
    };

    setPosts((prev) => [newPost, ...prev]);
    setText("");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        notifications={currentUser.notifications}
        rooms={myRooms}
        alias={currentUser.alias}
      />

      {/* ส่วนหัวห้อง */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-gray-500">
            <Link
              href="/"
              className="hover:text-gray-800 hover:underline transition-colors"
            >
              หน้าหลัก
            </Link>
            <span className="mx-1.5">/</span>
            <span>{room.name}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {room.name}
              </h1>

              <p className="mb-3 text-sm text-gray-500">{room.description}</p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {room.isPrivate ? "ส่วนตัว" : "สาธารณะ"}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  สมาชิก {formatCount(room.members)}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  ออนไลน์ {room.postsToday} คน
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsJoined((prev) => !prev)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {isJoined ? "เข้าร่วมแล้ว" : "เข้าร่วมห้อง"}
              </button>
              <button
                type="button"
                aria-label="ตัวเลือกห้อง"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                •••
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* กล่องตั้งกระทู้ */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <div
              aria-hidden="true"
              className="h-9 w-9 shrink-0 rounded-full bg-gray-300"
            />

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePost()}
              placeholder="ตั้งกระทู้ในห้องนี้..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />

            <button
              type="button"
              onClick={handlePost}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 cursor-pointer transition-colors"
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
            <PostCard
              key={post.id}
              id={post.id}
              roomId={room.id}
              author={post.author}
              time={post.timeLabel}
              content={post.content}
              reactions={post.reactions}
              replyCount={post.replyCount}
            />
          ))}
        </div>

        {/* กติกาห้อง */}
        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-gray-900">กติกาของห้อง</h2>

          <ol className="space-y-2 text-sm text-gray-700">
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
