"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Header from "@/component/Header";
import PostCard from "@/component/PostCard";
import { ReportModal } from "@/component/post-thread/ReportModal";
import { formatCount } from "@/lib/format";
import {
  deleteBoardPost,
  editBoardPost,
  formatRelativeTimeThai,
  TIME_REFRESH_INTERVAL_MS,
  toggleReaction,
} from "@/lib/post-thread";
import { DEFAULT_ROOM_RULES } from "@/lib/room-board";
import {
  createRoomPost,
  deleteRoomPost,
  reportRoomTarget,
  toggleRoomPostReaction,
  updateRoomMembership,
  updateRoomPost,
  type RoomBoardViewer,
} from "@/app/rooms/[roomId]/actions";
import type { MyRoom, Room } from "@/types/room";
import type {
  BoardPostSummary,
  ReportReason,
  RoomBoardMembershipState,
} from "@/types/post-thread";

type Props = {
  room: Room & { rulesList?: string[]; isLocked?: boolean };
  initialPosts: BoardPostSummary[];
  initialMembership: RoomBoardMembershipState;
  currentUser?: RoomBoardViewer | null;
  myRooms?: MyRoom[];
  serverTime?: string;
};

function createOptimisticPost(
  roomId: string,
  currentUser: RoomBoardViewer,
  content: string
): { nowMs: number; post: BoardPostSummary } {
  const nowMs = Date.now();
  return {
    nowMs,
    post: {
      id: `temp-${nowMs}`,
      roomId,
      authorId: currentUser.id,
      author: currentUser.alias,
      createdAt: new Date(nowMs).toISOString(),
      createdAtOffsetMs: 0,
      timeLabel: "เมื่อสักครู่",
      content,
      reactions: [],
      replyCount: 0,
    },
  };
}

export default function RoomBoardFeed({
  room,
  initialPosts,
  initialMembership,
  currentUser = null,
  myRooms = [],
  serverTime,
}: Props) {
  const [referenceTime, setReferenceTime] = useState<number>(() => {
    if (serverTime) {
      const parsed = Date.parse(serverTime);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 0;
  });
  const [prevInitialPosts, setPrevInitialPosts] = useState(initialPosts);
  const [posts, setPosts] = useState<BoardPostSummary[]>(initialPosts);
  if (initialPosts !== prevInitialPosts) {
    setPrevInitialPosts(initialPosts);
    setPosts(initialPosts);
  }

  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [prevInitialMembership, setPrevInitialMembership] =
    useState(initialMembership);
  const [membership, setMembership] =
    useState<RoomBoardMembershipState>(initialMembership);
  if (initialMembership !== prevInitialMembership) {
    setPrevInitialMembership(initialMembership);
    setMembership(initialMembership);
  }
  const [isMembershipPending, setIsMembershipPending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isReportingRoom, setIsReportingRoom] = useState(false);
  const roomMenuRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rulesList =
    room.rulesList && room.rulesList.length > 0
      ? room.rulesList
      : [...DEFAULT_ROOM_RULES];

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

  async function handlePost() {
    if (isPosting) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!currentUser) {
      showToast("กรุณาเข้าสู่ระบบก่อนตั้งกระทู้");
      return;
    }

    if (room.isLocked) {
      showToast("ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถตั้งกระทู้ใหม่ได้");
      return;
    }

    if (membership.status !== "joined") {
      showToast("กรุณาเข้าร่วมห้องก่อนตั้งกระทู้");
      return;
    }

    const { nowMs, post: optimisticPost } = createOptimisticPost(
      room.id,
      currentUser,
      trimmed
    );
    const tempId = optimisticPost.id;

    setIsPosting(true);
    setReferenceTime(nowMs);
    setPosts((prev) => [optimisticPost, ...prev]);
    setText("");

    try {
      const result = await createRoomPost({
        roomId: room.id,
        content: trimmed,
      });
      if (!result.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== tempId));
        setText(trimmed);
        showToast(result.error);
        return;
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === tempId ? result.data : p))
      );
      showToast("ตั้งกระทู้เรียบร้อยแล้ว");
    } catch {
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      setText(trimmed);
      showToast("ไม่สามารถตั้งกระทู้ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleEditPost(postId: string, newContent: string) {
    if (!currentUser) {
      showToast("กรุณาเข้าสู่ระบบก่อนแก้ไขกระทู้");
      return;
    }

    const previousPosts = posts;
    setPosts((prev) =>
      editBoardPost(prev, postId, newContent, currentUser.id)
    );

    try {
      const result = await updateRoomPost({
        roomId: room.id,
        postId,
        content: newContent,
      });
      if (!result.ok) {
        setPosts(previousPosts);
        showToast(result.error);
        return;
      }
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? result.data : p))
      );
      showToast("แก้ไขกระทู้เรียบร้อยแล้ว");
    } catch {
      setPosts(previousPosts);
      showToast("ไม่สามารถแก้ไขกระทู้ได้ กรุณาลองใหม่อีกครั้ง");
    }
  }

  async function handleDeletePost(postId: string) {
    if (!currentUser) {
      showToast("กรุณาเข้าสู่ระบบก่อนลบกระทู้");
      return;
    }

    const previousPosts = posts;
    setPosts((prev) => deleteBoardPost(prev, postId, currentUser.id));

    try {
      const result = await deleteRoomPost({
        roomId: room.id,
        postId,
      });
      if (!result.ok) {
        setPosts(previousPosts);
        showToast(result.error);
        return;
      }
      showToast("ลบกระทู้เรียบร้อยแล้ว");
    } catch {
      setPosts(previousPosts);
      showToast("ไม่สามารถลบกระทู้ได้ กรุณาลองใหม่อีกครั้ง");
    }
  }

  async function handleTogglePostReaction(postId: string, emoji: string) {
    const previousPosts = posts;

    if (!currentUser) {
      setPosts(previousPosts);
      showToast("กรุณาเข้าสู่ระบบก่อนกดรีแอคชัน");
      return;
    }

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const normalized = p.reactions.map((r) => ({
          emoji: r.emoji,
          count: r.count,
          reactedByMe: Boolean(r.reactedByMe),
        }));
        return {
          ...p,
          reactions: toggleReaction(normalized, emoji),
        };
      })
    );

    try {
      const result = await toggleRoomPostReaction({
        roomId: room.id,
        postId,
        emoji,
      });
      if (!result.ok) {
        setPosts(previousPosts);
        showToast(result.error);
        return;
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, reactions: result.data.reactions } : p
        )
      );
    } catch {
      setPosts(previousPosts);
      showToast("ไม่สามารถอัปเดตรีแอคชันได้ กรุณาลองใหม่อีกครั้ง");
    }
  }

  async function handleMembershipClick() {
    if (isMembershipPending) return;

    if (!currentUser) {
      showToast("กรุณาเข้าสู่ระบบก่อนดำเนินการ");
      return;
    }

    if (membership.status === "joined") {
      setIsLeaveModalOpen(true);
      return;
    }

    const previousMembership = membership;
    setIsMembershipPending(true);
    try {
      if (membership.status === "requested") {
        const result = await updateRoomMembership({
          roomId: room.id,
          action: "leave",
        });
        if (!result.ok) {
          setMembership(previousMembership);
          showToast(result.error);
          return;
        }
        setMembership(result.data);
        showToast("ยกเลิกคำขอเข้าร่วมห้องแล้ว");
        return;
      }

      const result = await updateRoomMembership({
        roomId: room.id,
        action: "join",
      });
      if (!result.ok) {
        setMembership(previousMembership);
        showToast(result.error);
        return;
      }
      setMembership(result.data);
      showToast(
        room.isPrivate
          ? "ส่งคำขอเข้าร่วมห้องเรียบร้อยแล้ว"
          : `เข้าร่วม${room.name}เรียบร้อยแล้ว`
      );
    } catch {
      setMembership(previousMembership);
      showToast("ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsMembershipPending(false);
    }
  }

  async function handleConfirmLeave() {
    if (isMembershipPending) return;
    setIsLeaveModalOpen(false);
    const previousMembership = membership;
    setIsMembershipPending(true);

    try {
      const result = await updateRoomMembership({
        roomId: room.id,
        action: "leave",
      });
      if (!result.ok) {
        setMembership(previousMembership);
        showToast(result.error);
        return;
      }
      setMembership(result.data);
      showToast(`ออกจาก${room.name}แล้ว`);
    } catch {
      setMembership(previousMembership);
      showToast("ไม่สามารถออกจากห้องได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsMembershipPending(false);
    }
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

  async function handleReportPostSubmit(
    postId: string,
    reason: ReportReason,
    details: string
  ) {
    try {
      const result = await reportRoomTarget({
        roomId: room.id,
        postId,
        reason,
        details,
      });
      if (!result.ok) {
        showToast(result.error);
        return;
      }
      showToast("ส่งรายงานกระทู้ให้ทีมงานตรวจสอบเรียบร้อยแล้ว");
    } catch {
      showToast("ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง");
    }
  }

  async function handleReportRoomSubmit(
    reason: ReportReason,
    details: string
  ) {
    setIsReportingRoom(false);
    try {
      const result = await reportRoomTarget({
        roomId: room.id,
        reason,
        details,
      });
      if (!result.ok) {
        showToast(result.error);
        return;
      }
      showToast("ส่งรายงานห้องให้ทีมงานตรวจสอบเรียบร้อยแล้ว");
    } catch {
      showToast("ไม่สามารถส่งรายงานห้องได้ กรุณาลองใหม่อีกครั้ง");
    }
  }

  const nonMemberComposerMessage = !currentUser
    ? "เข้าสู่ระบบและเข้าร่วมห้องก่อนจึงจะตั้งกระทู้ได้"
    : membership.status === "requested"
      ? "ส่งคำขอเข้าร่วมห้องนี้แล้ว รอการอนุมัติก่อนตั้งกระทู้"
      : "เข้าร่วมห้องก่อนจึงจะตั้งกระทู้และพูดคุยในห้องนี้ได้";

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-[#18181b] font-sans leading-[1.4]">
      <Header
        notifications={currentUser?.notifications ?? 0}
        rooms={myRooms}
        alias={currentUser?.alias ?? "ผู้เยี่ยมชม"}
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
                  สมาชิก {formatCount(membership.memberCount)}
                </span>
                <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-medium text-[#166534] leading-[1.4]">
                  โพสต์วันนี้ {room.postsToday}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
              {membership.status === "joined" ? (
                <button
                  type="button"
                  disabled={isMembershipPending}
                  onClick={handleMembershipClick}
                  className="rounded-lg border border-[#e4e4e7] bg-white px-4 py-[9px] text-sm font-semibold text-[#18181b] hover:bg-[#f4f4f5] active:scale-[0.98] disabled:opacity-60 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
                >
                  เข้าร่วมแล้ว
                </button>
              ) : membership.status === "requested" ? (
                <button
                  type="button"
                  disabled={isMembershipPending}
                  onClick={handleMembershipClick}
                  className="rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-[9px] text-sm font-semibold text-[#71717a] hover:bg-[#e4e4e7] active:scale-[0.98] disabled:opacity-60 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
                >
                  ส่งคำขอแล้ว
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isMembershipPending}
                  onClick={handleMembershipClick}
                  className="rounded-lg bg-[#18181b] px-4 py-[9px] text-sm font-semibold text-white hover:bg-[#27272a] active:scale-[0.98] disabled:opacity-60 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
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
                  className={`rounded-lg border border-[#e4e4e7] px-4 py-[9px] text-sm font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 ${
                    isRoomMenuOpen
                      ? "bg-[#f4f4f5] text-[#18181b]"
                      : "bg-white text-[#a1a1aa] hover:text-[#18181b] hover:bg-[#f4f4f5] active:scale-[0.98]"
                  }`}
                >
                  •••
                </button>

                {isRoomMenuOpen && (
                  <div
                    role="menu"
                    aria-label="เมนูตัวเลือกห้อง"
                    className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-[#e4e4e7] bg-white p-1.5 shadow-lg z-30 flex flex-col text-sm font-medium text-[#18181b]"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleCopyRoomLink}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#f4f4f5] transition-colors cursor-pointer"
                    >
                      คัดลอกลิงก์ห้อง
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleToggleMute}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#f4f4f5] transition-colors cursor-pointer"
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
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#f4f4f5] text-[#dc2626] transition-colors cursor-pointer"
                      >
                        ออกจากห้อง
                      </button>
                    )}

                    <div className="my-1 border-t border-[#e4e4e7]" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsRoomMenuOpen(false);
                        setIsReportingRoom(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#f4f4f5] text-[#dc2626] transition-colors cursor-pointer"
                    >
                      รายงานห้อง
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* เนื้อหาหลัก (Body) */}
      <main className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12 xl:px-[120px] pt-6 pb-32 sm:pb-16 flex flex-col lg:flex-row items-start gap-6 lg:gap-8 flex-1">
        {/* Accordion กติกาของห้องสำหรับหน้าจอ < 1024px */}
        <details className="group lg:hidden w-full rounded-xl border border-[#e4e4e7] bg-white transition-colors overflow-hidden">
          <summary className="min-h-[44px] px-4 py-3 flex items-center justify-between font-semibold text-sm text-[#18181b] cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2">
            <span>กติกาของห้อง</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#71717a] transition-transform duration-120 motion-reduce:transition-none group-open:rotate-90 shrink-0"
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
            <ol className="space-y-2 text-sm font-normal text-[#18181b] leading-[1.4] border-t border-[#e4e4e7] pt-3">
              {rulesList.map((rule, index) => (
                <li key={index}>
                  {index + 1}. {rule}
                </li>
              ))}
            </ol>
          </div>
        </details>

        {/* ฟีดกระทู้ (Feed Column) */}
        <section
          aria-label="ฟีดกระทู้"
          className="flex-1 min-w-0 flex flex-col gap-4 w-full"
        >
          {/* กล่องตั้งกระทู้ (Composer / Option A Membership Gate) */}
          {room.isLocked ? (
            <div className="rounded-xl border border-[#e4e4e7] bg-white px-4 py-3.5 text-sm text-[#71717a] w-full">
              ห้องนี้ถูกล็อกชั่วคราว ไม่สามารถตั้งกระทู้ใหม่ได้
            </div>
          ) : membership.status !== "joined" ? (
            <div className="rounded-xl border border-[#e4e4e7] bg-white px-4 py-3.5 text-sm text-[#71717a] w-full">
              {nonMemberComposerMessage}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handlePost();
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
                disabled={isPosting}
                placeholder="ตั้งกระทู้ในห้องนี้…"
                className="flex-1 min-w-0 h-[38px] sm:h-[42px] rounded-lg border border-[#e4e4e7] bg-white px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 leading-[1.4] disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!text.trim() || isPosting}
                className="h-[38px] px-3 sm:px-4 py-[9px] rounded-lg bg-[#18181b] text-white text-xs sm:text-sm font-semibold hover:bg-[#27272a] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2"
              >
                {isPosting ? "กำลังโพสต์..." : "ตั้งกระทู้"}
              </button>
            </form>
          )}

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
                time={
                  post.createdAt
                    ? formatRelativeTimeThai(post.createdAt, referenceTime)
                    : post.timeLabel
                }
                createdAt={post.createdAt}
                content={post.content}
                isOwner={Boolean(currentUser && post.authorId === currentUser.id)}
                isEdited={post.isEdited}
                reactions={post.reactions}
                replyCount={post.replyCount}
                onEditPost={(newContent) =>
                  void handleEditPost(post.id, newContent)
                }
                onDeletePost={() => void handleDeletePost(post.id)}
                onToggleReaction={(emoji) =>
                  handleTogglePostReaction(post.id, emoji)
                }
                onReportPost={(reason, details) =>
                  handleReportPostSubmit(post.id, reason, details)
                }
                onReportSubmitted={(msg) =>
                  showToast(
                    msg ?? "ส่งรายงานกระทู้ให้ทีมงานตรวจสอบเรียบร้อยแล้ว"
                  )
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
            {rulesList.map((rule, index) => (
              <li key={index}>
                {index + 1}. {rule}
              </li>
            ))}
          </ol>
        </aside>
      </main>

      {/* Leave Room Modal */}
      {isLeaveModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-zinc-900/45 flex items-center justify-center p-4"
          onClick={() => setIsLeaveModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-room-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[#e4e4e7] bg-white p-6 shadow-xl flex flex-col gap-4 text-[#18181b]"
          >
            <div className="flex flex-col gap-1">
              <h3
                id="leave-room-title"
                className="text-lg font-bold text-[#18181b]"
              >
                ออกจากห้องนี้ไหม?
              </h3>
              <p className="text-sm text-[#71717a]">
                หากออกจากห้อง {room.name} คุณจะไม่ได้รับการแจ้งเตือนและการอัปเดตใหม่ๆ จากห้องนี้
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="rounded-lg border border-[#e4e4e7] bg-white px-4 py-2 text-sm font-semibold text-[#18181b] hover:bg-[#f4f4f5] transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmLeave()}
                className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b91c1c] transition-colors cursor-pointer"
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
        onSubmit={(reason, details) => void handleReportRoomSubmit(reason, details)}
      />

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
