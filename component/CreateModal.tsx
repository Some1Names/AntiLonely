"use client";

import { useState } from "react";
import Icon, { type IconName } from "@/component/Icon";
import Modal from "@/component/Modal";
import Sheet from "@/component/Sheet";
import type { MyRoom } from "@/types/room";
import {
  choiceClass,
  disabledButtonClass,
  hintClass,
  inputClass,
  labelClass,
  outlineButtonClass,
  primaryButtonClass,
  radioClass,
  secondaryButtonClass,
  tabClass,
  tabListClass,
} from "@/lib/styles";

export type CreateTab = "post" | "room";

const POST_MAX = 2000;
const ROOM_NAME_MIN = 3;
const ROOM_NAME_MAX = 40;

const tabs: { id: CreateTab; label: string }[] = [
  { id: "post", label: "กระทู้" },
  { id: "room", label: "ห้อง" },
];

// "+ สร้าง" in the header: post a thread in a room you've joined, or start a
// new room. No backend yet, so submitting just closes it.
export default function CreateModal({
  rooms,
  alias,
  initialTab = "post",
  onClose,
}: {
  rooms: MyRoom[];
  alias: string;
  initialTab?: CreateTab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<CreateTab>(initialTab);

  return (
    <Modal labelledBy="create-title" onClose={onClose} size="md" sheetName="create-sheet">
      <Sheet titleId="create-title" title="สร้าง">
        <div
          role="tablist"
          aria-label="สร้างอะไร"
          className={tabListClass}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`create-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`create-panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={tabClass}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`create-panel-${tab}`}
          aria-labelledby={`create-tab-${tab}`}
          className="mt-5"
        >
          {tab === "post" ? (
            <PostForm rooms={rooms} alias={alias} onClose={onClose} />
          ) : (
            <RoomForm onClose={onClose} />
          )}
        </div>
      </Sheet>
    </Modal>
  );
}

function PostForm({
  rooms,
  alias,
  onClose,
}: {
  rooms: MyRoom[];
  alias: string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const hasRooms = rooms.length > 0;
  const canPost = hasRooms && text.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (canPost) onClose();
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="post-room" className={labelClass}>
          ห้อง
        </label>
        <select id="post-room" name="room" disabled={!hasRooms} className={inputClass}>
          {!hasRooms && <option>ยังไม่ได้เข้าห้องไหน</option>}
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        <p className={hintClass}>
          {hasRooms
            ? "เลือกได้เฉพาะห้องที่เข้าร่วมแล้วนะ"
            : "เข้าร่วมสักห้องก่อน แล้วค่อยมาตั้งกระทู้นะ"}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <label htmlFor="post-text" className={labelClass}>
            ข้อความ
          </label>
          <span className={hintClass} aria-live="polite">
            {text.length} / {POST_MAX}
          </span>
        </div>
        <textarea
          id="post-text"
          name="text"
          rows={4}
          maxLength={POST_MAX}
          placeholder="อะไรก็ได้ตามใจฉัน...."
          value={text}
          onChange={(event) => setText(event.target.value)}
          className={`resize-y ${inputClass}`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          className={`flex min-w-0 cursor-pointer items-center gap-2 px-4 py-2 ${outlineButtonClass} has-focus-visible:ring-3 has-focus-visible:ring-kmutt-yellow/40`}
        >
          <Icon name="image" className="size-4" />
          <span className="max-w-48 truncate">{image ?? "แนบรูป"}</span>
          <input
            type="file"
            name="image"
            accept="image/*"
            className="sr-only"
            onChange={(event) => setImage(event.target.files?.[0]?.name ?? null)}
          />
        </label>
        {alias && (
          <span className="flex items-center gap-2 rounded-full border-[1.5px] border-butter-edge bg-butter px-3 py-1 text-sm">
            <span aria-hidden="true" className="size-2 rounded-full bg-green-600" />
            โพสต์ในชื่อ <span className="font-semibold">{alias}</span>
          </span>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={`px-4 py-2 ${secondaryButtonClass}`}>
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={!canPost}
          className={`px-4 py-2 ${primaryButtonClass} ${disabledButtonClass}`}
        >
          ตั้งกระทู้
        </button>
      </div>
    </form>
  );
}

function RoomForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const length = name.trim().length;
  const canCreate = length >= ROOM_NAME_MIN && length <= ROOM_NAME_MAX;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (canCreate) onClose();
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="room-name" className={labelClass}>
          ชื่อห้อง
        </label>
        <input
          id="room-name"
          name="name"
          type="text"
          required
          minLength={ROOM_NAME_MIN}
          maxLength={ROOM_NAME_MAX}
          placeholder="ศาลาคนเศร้า"
          aria-describedby="room-name-hint"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
        <p id="room-name-hint" className={hintClass}>
          {ROOM_NAME_MIN}–{ROOM_NAME_MAX} ตัวอักษร เปลี่ยนทีหลังได้
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="room-about" className={labelClass}>
          ห้องนี้คุยเรื่องอะไร
        </label>
        <textarea
          id="room-about"
          name="about"
          rows={3}
          placeholder="เล่าสั้น ๆ ให้คนอื่นรู้ว่าห้องนี้เกี่ยวกับอะไร"
          className={`resize-y ${inputClass}`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="room-rules" className={labelClass}>
          กติกาของห้อง
        </label>
        <textarea
          id="room-rules"
          name="rules"
          rows={3}
          placeholder="1. ใจดีต่อกัน 2. ไม่เปิดเผยข้อมูลส่วนตัว ..."
          className={`resize-y ${inputClass}`}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`mb-1 ${labelClass}`}>ใครเข้าร่วมได้บ้าง</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <VisibilityChoice
            value="public"
            title="สาธารณะ"
            detail="ใครก็หาเจอและเข้าร่วมได้"
            icon="users"
            defaultChecked
          />
          <VisibilityChoice
            value="private"
            title="ส่วนตัว"
            detail="ต้องขอเข้าร่วมหรือได้รับเชิญ"
            icon="lock"
          />
        </div>
      </fieldset>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={`px-4 py-2 ${secondaryButtonClass}`}>
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={!canCreate}
          className={`px-4 py-2 ${primaryButtonClass} ${disabledButtonClass}`}
        >
          สร้างห้อง
        </button>
      </div>
    </form>
  );
}

function VisibilityChoice({
  value,
  title,
  detail,
  icon,
  defaultChecked,
}: {
  value: string;
  title: string;
  detail: string;
  icon: IconName;
  defaultChecked?: boolean;
}) {
  return (
    <label className={`${choiceClass} flex-col gap-1`}>
      <span className="flex items-center gap-2">
        <input
          type="radio"
          name="visibility"
          value={value}
          defaultChecked={defaultChecked}
          className={radioClass}
        />
        {title}
        <Icon name={icon} className="ml-auto size-4 text-ink-soft" />
      </span>
      <span className="pl-6 text-xs font-normal text-ink-soft">{detail}</span>
    </label>
  );
}
