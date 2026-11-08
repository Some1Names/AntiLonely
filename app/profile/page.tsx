"use client";

import { useState } from "react";
import Header from "@/component/Header";
import PostCard from "@/component/PostCard";
import { currentUser, myRooms } from "@/lib/mock";

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
    <div className="min-h-screen bg-gray-50">
      <Header
        notifications={currentUser.notifications}
        rooms={myRooms}
        alias={currentUser.alias}
      />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 rounded-lg bg-gray-100 px-4 py-3 text-sm">
          🔒 <b>หน้านี้เห็นได้แค่คุณคนเดียว</b> คนอื่นจะเห็นแค่ชื่อเล่นของคุณในกระทู้
          แต่เปิดดูรวมทุกโพสต์ของคุณไม่ได้
        </div>

        <div className="mb-8 flex items-start justify-between">
          <div className="flex gap-5">
            <div className="h-24 w-24 rounded-full bg-gray-300" />
            <div className="space-y-1">
              <p className="font-medium">user1</p>
              <p className="text-sm text-gray-500">เพิ่งมาอยู่กับเรา</p>
              <p className="text-sm">
                <b>{myPosts.length}</b> กระทู้ &nbsp; <b>0</b> รีแอคชัน &nbsp;
                เข้าร่วม <b>0</b> ห้อง
              </p>
            </div>
          </div>
          <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold">
            แก้ไขโปรไฟล์
          </button>
        </div>

        {/* แท็บ */}
        <div className="mb-6 flex gap-6 border-b border-gray-200 text-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 ${
                activeTab === t.key
                  ? "border-b-2 border-neutral-900 font-semibold"
                  : "text-gray-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* เนื้อหาตามแท็บ */}
        <div className="space-y-4">
          {activeTab === "posts" && (
            <>
              {myPosts.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400">
                  ยังไม่มีกระทู้
                </p>
              )}
              {myPosts.map((p) => (
                <PostCard key={p.id} {...p} />
              ))}
            </>
          )}

          {activeTab === "comments" && (
            <p className="py-10 text-center text-sm text-gray-400">
              ยังไม่มีความคิดเห็น
            </p>
          )}

          {activeTab === "saved" && (
            <p className="py-10 text-center text-sm text-gray-400">
              ยังไม่มีที่บันทึกไว้
            </p>
          )}
        </div>
      </main>
    </div>
  );
}