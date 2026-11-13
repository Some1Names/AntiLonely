"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import EmptyNote from "@/component/EmptyNote";
import Header from "@/component/Header";
import Icon from "@/component/Icon";
import Tape from "@/component/Tape";
import PostCard from "@/component/PostCard";
import { ReportModal } from "@/component/post-thread/ReportModal";
import { formatCount } from "@/lib/format";
import { currentUser, defaultRoomEmoji, myRooms, type Room } from "@/lib/mock";
import {
  getMockBoardPosts,
  type BoardPostSummary,
} from "@/lib/mock/post-thread";
import {
  editBoardPost,
  deleteBoardPost,
  formatRelativeTimeThai,
  getInitialBoardMembership,
  joinBoardRoom,
  leaveBoardRoom,
  TIME_REFRESH_INTERVAL_MS,
} from "@/lib/post-thread";
import {
  avatarClass,
  dangerButtonClass,
  disabledButtonClass,
  highlightClass,
  indexCardClass,
  noteFieldClass,
  outlineButtonClass,
  primaryButtonClass,
  roomLook,
} from "@/lib/styles";
import type {
  RoomBoardMembershipState,
} from "@/types/post-thread";

type Props = {
  room: Room;
  initialPosts?: BoardPostSummary[];
  serverTime?: string;
};

const CURRENT_USER_ID = "user-platoo";

export default function RoomBoardFeed({
  room,
  initialPosts,
  serverTime,
}: Props) {
  const [referenceTime, setReferenceTime] = useState<number>(() => {
    if (serverTime) {
      const parsed = Date.parse(serverTime);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 0;
  });
  const [posts, setPosts] = useState<BoardPostSummary[]>(() =>
    initialPosts ?? getMockBoardPosts(room.id, referenceTime || undefined)
  );
  const [text, setText] = useState("");
  const [membership, setMembership] = useState<RoomBoardMembershipState>(() =>
    getInitialBoardMembership(room, [
      ...myRooms.map((r) => r.id),
      ...(room.id === "songs" ? ["songs"] : []),
    ])
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isReportingRoom, setIsReportingRoom] = useState(false);
  const roomMenuRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isRoomMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        roomMenuRef.current &&
        !roomMenuRef.current.contains(event.target as Node)
      ) {
        setIsRoomMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsRoomMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRoomMenuOpen]);

  useEffect(() => {
    if (!isLeaveModalOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLeaveModalOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLeaveModalOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setReferenceTime(Date.now());
    }, TIME_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
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

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    const newPost: BoardPostSummary = {
      id: `post-${nowMs}`,
      roomId: room.id,
      authorId: "user-platoo",
      author: currentUser.alias,
      createdAt: nowIso,
      createdAtOffsetMs: 0,
      timeLabel: "เมื่อสักครู่",
      content: trimmed,
      reactions: [],
      replyCount: 0,
    };

    setReferenceTime(nowMs);
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

  function handleMembershipClick() {
    if (membership.status === "joined") {
      setIsLeaveModalOpen(true);
      return;
    }
    if (membership.status === "requested") {
      setMembership((prev) => leaveBoardRoom(prev));
      showToast("ยกเลิกคำขอเข้าร่วมห้องแล้ว");
      return;
    }
    setMembership((prev) => joinBoardRoom(prev, room.isPrivate));
    showToast(
      room.isPrivate
        ? "ส่งคำขอเข้าร่วมห้องเรียบร้อยแล้ว"
        : `เข้าร่วม${room.name}เรียบร้อยแล้ว`
    );
  }

  function handleConfirmLeave() {
    setMembership((prev) => leaveBoardRoom(prev));
    setIsLeaveModalOpen(false);
    showToast(`ออกจาก${room.name}แล้ว`);
  }

  async function handleCopyRoomLink() {
    setIsRoomMenuOpen(false);
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/rooms/${room.id}`
          : `/rooms/${room.id}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      showToast("คัดลอกลิงก์ห้องเรียบร้อยแล้ว");
    } catch {
      showToast("ไม่สามารถคัดลอกลิงก์ได้");
    }
  }

  function handleToggleMute() {
    setIsRoomMenuOpen(false);
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    showToast(
      nextMuted ? "ปิดการแจ้งเตือนห้องนี้แล้ว" : "เปิดการแจ้งเตือนห้องนี้แล้ว"
    );
  }

  function handleReportRoomSubmit() {
    setIsReportingRoom(false);
    showToast("ส่งรายงานห้องให้ทีมงานตรวจสอบเรียบร้อยแล้ว");
  }

  // สีเงา เทป และพื้นหลังอิโมจิ ตามประเภทห้อง เหมือนการ์ดห้องในหน้าหลัก
  const look = roomLook(room);

  return (
    <div className="flex flex-1 flex-col">
      <Header
        notifications={currentUser.notifications}
        rooms={myRooms}
        alias={currentUser.alias}
      />

      {/* ส่วนหัวห้อง (Board Header): การ์ดแปะเทปสีตามห้อง */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-8 lg:px-12 xl:px-[120px]">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="flex items-center truncate whitespace-pre text-xs text-ink-soft">
            <li>
              <Link
                href="/"
                className="font-semibold text-kmutt-orange-dark underline-offset-4 hover:underline"
              >
                หน้าหลัก
              </Link>
            </li>
            <li aria-hidden="true">  /  </li>
            <li aria-current="page">{room.name}</li>
          </ol>
        </nav>

        <div
          className={`relative flex flex-col gap-4 rounded-xl border-[1.5px] border-ink bg-white p-5 pt-6 shadow-[4px_4px_0_var(--tone)] sm:p-6 md:flex-row md:items-end md:justify-between ${look.card}`}
        >
          <Tape className={`h-5 w-16 ${look.tape}`} />

          {/* Title, Description, Badges */}
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className={`flex size-14 shrink-0 items-center justify-center rounded-xl border-[1.5px] text-3xl ${look.tile}`}
            >
              {room.emoji ?? defaultRoomEmoji}
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="font-display text-2xl font-semibold leading-snug sm:text-3xl">
                <span className={highlightClass}>{room.name}</span>
              </h1>

              <p className="line-clamp-2 text-sm text-ink-soft md:line-clamp-none">
                {room.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                    room.isPrivate
                      ? "border-edge-strong bg-mist text-mist-ink"
                      : "border-butter-edge bg-butter text-ink"
                  }`}
                >
                  {room.isPrivate ? "ส่วนตัว" : "สาธารณะ"}
                </span>
                <span className="rounded-full border border-edge-strong bg-cream px-2 py-0.5 text-xs font-medium text-ink-soft">
                  สมาชิก {formatCount(membership.memberCount)}
                </span>
                <span className="rounded-full border border-kmutt-yellow-dark/60 bg-highlight px-2 py-0.5 text-xs font-medium text-ink">
                  ออนไลน์ {room.postsToday} คน
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-2 md:pt-0">
            {membership.status === "joined" ? (
              <button
                type="button"
                onClick={handleMembershipClick}
                className={`px-4 py-[9px] ${outlineButtonClass}`}
              >
                เข้าร่วมแล้ว
              </button>
            ) : membership.status === "requested" ? (
              <button
                type="button"
                onClick={handleMembershipClick}
                className="rounded-lg border-[1.5px] border-dashed border-edge-strong bg-cream px-4 py-[9px] text-sm font-semibold text-ink-soft hover:bg-butter hover:text-ink motion-safe:transition-colors"
              >
                ส่งคำขอแล้ว
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMembershipClick}
                className={`px-4 py-[9px] ${primaryButtonClass}`}
              >
                {room.isPrivate ? "ขอเข้าร่วม" : "เข้าร่วมห้อง"}
              </button>
            )}

            <div className="relative" ref={roomMenuRef}>
              <button
                type="button"
                aria-label="ตัวเลือกห้อง"
                aria-haspopup="true"
                aria-expanded={isRoomMenuOpen}
                onClick={() => setIsRoomMenuOpen((prev) => !prev)}
                className={`px-4 py-[9px] ${outlineButtonClass} ${
                  isRoomMenuOpen
                    ? "translate-0.5 bg-butter shadow-none"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                •••
              </button>

              {isRoomMenuOpen && (
                <div
                  role="menu"
                  aria-label="เมนูตัวเลือกห้อง"
                  className="absolute right-0 top-full z-30 mt-1.5 flex w-52 flex-col rounded-xl border-[1.5px] border-ink bg-white p-1.5 text-sm font-medium text-ink shadow-sticker"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleCopyRoomLink}
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-butter motion-safe:transition-colors"
                  >
                    คัดลอกลิงก์ห้อง
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleToggleMute}
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-butter motion-safe:transition-colors"
                  >
                    {isMuted ? "เปิดแจ้งเตือนห้องนี้" : "ปิดแจ้งเตือนห้องนี้"}
                  </button>

                  {membership.status === "joined" && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsRoomMenuOpen(false);
                        setIsLeaveModalOpen(true);
                      }}
                      className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-red-700 hover:bg-red-50 motion-safe:transition-colors"
                    >
                      ออกจากห้อง
                    </button>
                  )}

                  <div className="my-1 border-t-[1.5px] border-dashed border-edge" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsRoomMenuOpen(false);
                      setIsReportingRoom(true);
                    }}
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-red-700 hover:bg-red-50 motion-safe:transition-colors"
                  >
                    รายงานห้อง
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* เนื้อหาหลัก (Body) */}
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-start gap-6 px-4 pb-32 pt-6 sm:px-8 sm:pb-16 lg:flex-row lg:gap-8 lg:px-12 xl:px-[120px]">
        {/* Accordion กติกาของห้องสำหรับหน้าจอ < 1024px */}
        <details
          className={`group relative w-full overflow-hidden lg:hidden ${indexCardClass}`}
        >
          <summary className="flex min-h-[44px] cursor-pointer select-none list-none items-center justify-between px-4 py-3 font-display text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span>กติกาของห้อง</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 text-ink-soft transition-transform duration-120 motion-reduce:transition-none group-open:rotate-90"
              aria-hidden="true"
            >
              <path
                d="M6 3.5L10.5 8L6 12.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <div className="px-4 pb-4">
            <ol className="space-y-2 border-t-[1.5px] border-dashed border-edge pt-3 text-sm text-ink">
              <li>1. ใจดีต่อกัน เพราะหลังจอก็คือคนเหมือนกันน้า</li>
              <li>2. ไม่เปิดเผยข้อมูลส่วนตัว ทั้งของตัวเองและของคนอื่น</li>
              <li>3. ไม่สแปม ไม่ขายของ</li>
              <li>4. เจอคนไม่น่ารัก กดรายงานดีกว่าตอบโต้นะ</li>
            </ol>
          </div>
        </details>

        {/* ฟีดกระทู้ (Feed Column) */}
        <section
          aria-label="ฟีดกระทู้"
          className="flex w-full min-w-0 flex-1 flex-col gap-5"
        >
          {/* กล่องตั้งกระทู้ (Composer): กระดาษโน้ตสีเหลืองแบบหน้าหลัก */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePost();
            }}
            className="flex w-full items-center gap-2 rounded-lg border-[1.5px] border-ink bg-butter p-3 shadow-sticker-lg sm:gap-3 sm:p-4"
          >
            <span aria-hidden="true" className={`max-sm:hidden ${avatarClass}`}>
              <Icon name="user" className="size-4.5" />
            </span>

            <div className="relative min-w-0 flex-1">
              <Icon
                name="pencil"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-kmutt-yellow-dark"
              />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ตั้งกระทู้ในห้องนี้…"
                className={`h-[38px] py-2 pl-9 pr-3 leading-[1.4] sm:h-[42px] sm:py-2.5 ${noteFieldClass}`}
              />
            </div>

            <button
              type="submit"
              disabled={!text.trim()}
              className={`h-[38px] shrink-0 whitespace-nowrap px-3 py-[9px] text-xs sm:px-4 sm:text-sm ${primaryButtonClass} ${disabledButtonClass}`}
            >
              ตั้งกระทู้
            </button>
          </form>

          {/* แสดงโพสต์ หรือ Empty State */}
          {posts.length === 0 ? (
            <EmptyNote
              icon="message"
              title="ยังไม่มีกระทู้ในห้องนี้"
              description="มาเป็นคนแรกที่เปิดประเด็นในห้องนี้กันเถอะ"
            />
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                roomId={room.id}
                author={post.author}
                time={
                  post.createdAt
                    ? formatRelativeTimeThai(post.createdAt, referenceTime)
                    : post.timeLabel
                }
                createdAt={post.createdAt}
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
          className={`relative hidden w-[280px] shrink-0 flex-col gap-2 p-5 pt-6 xl:w-[320px] lg:flex ${indexCardClass}`}
        >
          <Tape />
          <h2 className="mb-1 border-b-[1.5px] border-dashed border-edge pb-2 font-display text-lg font-semibold">
            กติกาของห้อง
          </h2>

          <ol className="space-y-2 break-words text-sm text-ink">
            <li>1. ใจดีต่อกัน เพราะหลังจอก็คือคนเหมือนกันน้า</li>
            <li>2. ไม่เปิดเผยข้อมูลส่วนตัว ทั้งของตัวเองและของคนอื่น</li>
            <li>3. ไม่สแปม ไม่ขายของ</li>
            <li>4. เจอคนไม่น่ารัก กดรายงานดีกว่าตอบโต้นะ</li>
          </ol>
        </aside>
      </main>

      {/* Leave Room Modal */}
      {isLeaveModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/45 flex items-center justify-center p-4"
          onClick={() => setIsLeaveModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-room-title"
            onClick={(e) => e.stopPropagation()}
            className={`flex w-full max-w-sm flex-col gap-4 p-6 text-ink ${indexCardClass}`}
          >
            <div className="flex flex-col gap-1">
              <h3
                id="leave-room-title"
                className="font-display text-xl font-semibold"
              >
                ออกจากห้องนี้ไหม?
              </h3>
              <p className="text-sm text-ink-soft">
                หากออกจากห้อง {room.name} คุณจะไม่ได้รับการแจ้งเตือนและการอัปเดตใหม่ๆ จากห้องนี้
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className={`cursor-pointer px-4 py-2 ${outlineButtonClass}`}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className={`cursor-pointer px-4 py-2 ${dangerButtonClass}`}
              >
                ออกจากห้อง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Room Modal */}
      <ReportModal
        isOpen={isReportingRoom}
        targetType="room"
        onClose={() => setIsReportingRoom(false)}
        onSubmit={handleReportRoomSubmit}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border-[1.5px] border-ink bg-ink px-4 py-3 text-sm text-paper shadow-sticker"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
