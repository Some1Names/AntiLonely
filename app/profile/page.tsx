"use client";

import { useState } from "react";
import EmptyNote from "@/component/EmptyNote";
import Header from "@/component/Header";
import Icon from "@/component/Icon";
import PostCard from "@/component/PostCard";
import Tape from "@/component/Tape";
import { currentUser, myRooms } from "@/lib/mock";
import {
  highlightClass,
  indexCardClass,
  outlineButtonClass,
  tabClass,
  tabListClass,
} from "@/lib/styles";

type MyPost = {
  id: number;
  room: string;
  time: string;
  content: string;
  replyCount: number;
};

type Tab = "posts" | "comments" | "saved";

const tabs: { key: Tab; label: string }[] = [
  { key: "posts", label: "กระทู้ของฉัน" },
  { key: "comments", label: "ความคิดเห็น" },
  { key: "saved", label: "ที่บันทึกไว้" },
];

// เริ่มต้นยังไม่มีโพสต์
const myPosts: MyPost[] = [];

export default function ProfilePage() {
  // จำว่ากำลังเลือกแท็บไหนอยู่
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  return (
    <div className="flex flex-1 flex-col">
      <Header
        notifications={currentUser.notifications}
        rooms={myRooms}
        alias={currentUser.alias}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:py-8">
        {/* โน้ตสีเทาแบบป้าย "ส่วนตัว" */}
        <div className="flex items-start gap-2 rounded-lg border-[1.5px] border-dashed border-kmutt-grey/50 bg-mist px-4 py-3 text-sm text-mist-ink">
          <Icon name="lock" className="mt-0.5 size-4" />
          <p>
            <b>หน้านี้เห็นได้แค่คุณคนเดียว</b> คนอื่นจะเห็นแค่ชื่อเล่นของคุณในกระทู้
            แต่เปิดดูรวมทุกโพสต์ของคุณไม่ได้
          </p>
        </div>

        {/* บัตรโปรไฟล์: การ์ดแปะเทป */}
        <section
          className={`relative flex flex-col gap-5 p-5 pt-7 sm:flex-row sm:items-start sm:justify-between sm:p-6 sm:pt-7 ${indexCardClass}`}
        >
          <Tape />
          <div className="flex items-center gap-5">
            <span
              aria-hidden="true"
              className="flex size-20 shrink-0 -rotate-3 items-center justify-center rounded-full border-[1.5px] border-ink bg-peach shadow-sticker-lg sm:size-24"
            >
              <Icon name="user" className="size-10 sm:size-12" />
            </span>
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-semibold">
                <span className={highlightClass}>user1</span>
              </h1>
              <p className="text-sm text-ink-soft">เพิ่งมาอยู่กับเรา</p>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center gap-1">
                  <Icon name="message" className="size-4 text-ink-soft" />
                  <b>{myPosts.length}</b> กระทู้
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="heart" className="size-4 text-ink-soft" />
                  <b>0</b> รีแอคชัน
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="users" className="size-4 text-ink-soft" />
                  เข้าร่วม <b>0</b> ห้อง
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`flex shrink-0 items-center justify-center gap-1.5 self-start px-4 py-2 ${outlineButtonClass}`}
          >
            <Icon name="pencil" className="size-4" />
            แก้ไขโปรไฟล์
          </button>
        </section>

        {/* แท็บ */}
        <div
          role="tablist"
          aria-label="เนื้อหาของฉัน"
          className={`self-start max-w-full overflow-x-auto no-scrollbar ${tabListClass}`}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`profile-tab-${t.key}`}
              aria-selected={activeTab === t.key}
              aria-controls="profile-panel"
              onClick={() => setActiveTab(t.key)}
              className={tabClass}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* เนื้อหาตามแท็บ */}
        <div
          role="tabpanel"
          id="profile-panel"
          aria-labelledby={`profile-tab-${activeTab}`}
          className="space-y-4"
        >
          {activeTab === "posts" && (
            <>
              {myPosts.length === 0 && (
                <EmptyNote icon="pencil" title="ยังไม่มีกระทู้" />
              )}
              {myPosts.map((p) => (
                <PostCard key={p.id} {...p} />
              ))}
            </>
          )}

          {activeTab === "comments" && (
            <EmptyNote icon="message" title="ยังไม่มีความคิดเห็น" />
          )}

          {activeTab === "saved" && (
            <EmptyNote icon="bookmark" title="ยังไม่มีที่บันทึกไว้" />
          )}
        </div>
      </main>
    </div>
  );
}
