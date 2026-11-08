"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Header from "@/component/Header";
import PostCard from "@/component/PostCard";
import { formatCount } from "@/lib/format";
import { currentUser, myRooms, type Room } from "@/lib/mock";
import {
  getMockBoardPosts,
  type BoardPostSummary,
} from "@/lib/mock/post-thread";
import { editBoardPost, deleteBoardPost } from "@/lib/post-thread";

type Props = {
  room: Room;
};

const CURRENT_USER_ID = "user-platoo";

export default function RoomBoardFeed({ room }: Props) {
  const [posts, setPosts] = useState<BoardPostSummary[]>(() =>
    getMockBoardPosts(room.id)
  );
  const [text, setText] = useState("");
  const [isJoined, setIsJoined] = useState<boolean>(() =>
    myRooms.some((r) => r.id === room.id) || room.id === "songs"
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  function handlePost() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newPost: BoardPostSummary = {
      id: `post-${Date.now()}`,
      roomId: room.id,
      authorId: "user-platoo",
      author: currentUser.alias,
      createdAtOffsetMs: 0,
      timeLabel: "เมื่อสักครู่",
      content: trimmed,
      reactions: [],
      replyCount: 0,
    };

    setPosts((prev) => [newPost, ...prev]);
    setText("");
  }

  function handleEditPost(postId: string, newContent: string) {
    setPosts((prev) =>
      editBoardPost(prev, postId, newContent, CURRENT_USER_ID)
    );
    showToast("แก้ไขกระทู้เรียบร้อยแล้ว");
  }

  function handleDeletePost(postId: string) {
    setPosts((prev) => deleteBoardPost(prev, postId, CURRENT_USER_ID));
    showToast("ลบกระทู้เรียบร้อยแล้ว");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-[#18181b] font-sans leading-[1.4]">
      <Header
        notifications={currentUser.notifications}
        rooms={myRooms}
        alias={currentUser.alias}
      />

      {/* ส่วนหัวห้อง (Board Header) */}
      <section className="border-b border-[#e4e4e7] bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12 xl:px-[120px] py-6 flex flex-col gap-3">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb">
            <ol className="flex items-center text-[13px] font-normal text-[#71717a] leading-[1.4] whitespace-pre truncate">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#18181b] transition-colors focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
                >
                  หน้าหลัก
                </Link>
              </li>
              <li aria-hidden="true">  /  </li>
              <li aria-current="page" className="text-[#18181b] font-normal">
                {room.name}
              </li>
            </ol>
          </nav>

          {/* แถวหลัก (Title, Description, Badges & Action Buttons) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <h1 className="text-2xl sm:text-[30px] font-bold text-[#18181b] leading-[1.4]">
                {room.name}
              </h1>

              <p className="text-sm font-normal text-[#71717a] leading-[1.4] line-clamp-2 md:line-clamp-none">
                {room.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="rounded-full bg-[#f4f4f5] px-2 py-0.5 text-xs font-medium text-[#71717a] leading-[1.4]">
                  {room.isPrivate ? "ส่วนตัว" : "สาธารณะ"}
                </span>
                <span className="rounded-full bg-[#f4f4f5] px-2 py-0.5 text-xs font-medium text-[#71717a] leading-[1.4]">
                  สมาชิก {formatCount(room.members)}
                </span>
                <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-medium text-[#166534] leading-[1.4]">
                  ออนไลน์ {room.postsToday} คน
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={() => setIsJoined((prev) => !prev)}
                className="rounded-lg border border-[#e4e4e7] bg-white px-4 py-[9px] text-sm font-semibold text-[#18181b] hover:bg-[#f4f4f5] active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
              >
                {isJoined ? "เข้าร่วมแล้ว" : "เข้าร่วมห้อง"}
              </button>
              <button
                type="button"
                aria-label="ตัวเลือกห้อง"
                className="rounded-lg border border-[#e4e4e7] bg-white px-4 py-[9px] text-sm font-semibold text-[#a1a1aa] hover:text-[#18181b] hover:bg-[#f4f4f5] active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
              >
                •••
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* เนื้อหาหลัก (Body) */}
      <main className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12 xl:px-[120px] pt-6 pb-16 flex flex-col lg:flex-row items-start gap-6 lg:gap-8 flex-1">
        {/* Accordion กติกาของห้องสำหรับหน้าจอ < 1024px */}
        <details className="lg:hidden w-full rounded-xl border border-[#e4e4e7] bg-white p-4 transition-colors">
          <summary className="font-semibold text-sm text-[#18181b] cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2">
            กติกาของห้อง (แตะเพื่อดูรายละเอียด)
          </summary>
          <ol className="mt-3 space-y-2 text-sm font-normal text-[#18181b] leading-[1.4] border-t border-[#e4e4e7] pt-3">
            <li>1. ใจดีต่อกัน เพราะหลังจอก็คือคนเหมือนกันน้า</li>
            <li>2. ไม่เปิดเผยข้อมูลส่วนตัว ทั้งของตัวเองและของคนอื่น</li>
            <li>3. ไม่สแปม ไม่ขายของ</li>
            <li>4. เจอคนไม่น่ารัก กดรายงานดีกว่าตอบโต้นะ</li>
          </ol>
        </details>

        {/* ฟีดกระทู้ (Feed Column) */}
        <section
          aria-label="ฟีดกระทู้"
          className="flex-1 min-w-0 flex flex-col gap-4 w-full"
        >
          {/* กล่องตั้งกระทู้ (Composer) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePost();
            }}
            className="flex items-center gap-2 sm:gap-3 rounded-xl border border-[#e4e4e7] bg-white p-3 sm:p-4 w-full"
          >
            <div
              aria-hidden="true"
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-[#d4d4d8]"
            />

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ตั้งกระทู้ในห้องนี้…"
              className="flex-1 min-w-0 h-[38px] sm:h-[42px] rounded-lg border border-[#e4e4e7] bg-white px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 leading-[1.4]"
            />

            <button
              type="submit"
              disabled={!text.trim()}
              className="h-[38px] px-3 sm:px-4 py-[9px] rounded-lg bg-[#18181b] text-white text-xs sm:text-sm font-semibold hover:bg-[#27272a] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
            >
              ตั้งกระทู้
            </button>
          </form>

          {/* แสดงโพสต์ หรือ Empty State */}
          {posts.length === 0 ? (
            <div className="rounded-xl border border-[#e4e4e7] bg-white py-12 px-6 text-center flex flex-col items-center justify-center gap-3">
              <p className="text-base font-medium text-[#18181b]">
                ยังไม่มีกระทู้ในห้องนี้
              </p>
              <p className="text-sm text-[#71717a]">
                มาเป็นคนแรกที่เปิดประเด็นในห้องนี้กันเถอะ
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                roomId={room.id}
                author={post.author}
                time={post.timeLabel}
                content={post.content}
                isOwner={post.authorId === CURRENT_USER_ID}
                isEdited={post.isEdited}
                reactions={post.reactions}
                replyCount={post.replyCount}
                onEditPost={(newContent) =>
                  handleEditPost(post.id, newContent)
                }
                onDeletePost={() => handleDeletePost(post.id)}
                onReportSubmitted={(msg) =>
                  showToast(msg ?? "ส่งรายงานกระทู้ให้ทีมงานตรวจสอบเรียบร้อยแล้ว")
                }
              />
            ))
          )}
        </section>

        {/* กติกาห้อง (Right Rail สำหรับ Desktop >= 1024px) */}
        <aside
          aria-label="กติกาของห้อง"
          className="hidden lg:flex flex-col gap-2 w-[280px] xl:w-[320px] shrink-0 rounded-xl border border-[#e4e4e7] bg-white p-5 leading-[1.4]"
        >
          <h2 className="mb-1 text-base font-semibold text-[#18181b] leading-[1.4]">
            กติกาของห้อง
          </h2>

          <ol className="space-y-2 text-sm font-normal text-[#18181b] leading-[1.4] break-words">
            <li>1. ใจดีต่อกัน เพราะหลังจอก็คือคนเหมือนกันน้า</li>
            <li>2. ไม่เปิดเผยข้อมูลส่วนตัว ทั้งของตัวเองและของคนอื่น</li>
            <li>3. ไม่สแปม ไม่ขายของ</li>
            <li>4. เจอคนไม่น่ารัก กดรายงานดีกว่าตอบโต้นะ</li>
          </ol>
        </aside>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#18181b] text-white text-sm px-4 py-3 rounded-xl shadow-lg border border-zinc-800 flex items-center gap-2"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
