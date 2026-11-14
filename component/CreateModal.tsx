"use client";

import { useState } from "react";
import Icon, { type IconName } from "@/component/Icon";
import Modal from "@/component/Modal";
import Sheet from "@/component/Sheet";
import Spinner from "@/component/Spinner";
import { usePostToRoom } from "@/component/usePostToRoom";
import { MAX_POST_CONTENT_LENGTH } from "@/lib/room-board";
import type { MyRoom } from "@/types/room";
import {
  alertClass,
  choiceClass,
  disabledButtonClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  radioClass,
  secondaryButtonClass,
  tabClass,
  tabListClass,
} from "@/lib/styles";

export type CreateTab = "post" | "room";

const ROOM_NAME_MIN = 3;
const ROOM_NAME_MAX = 40;

const tabs: { id: CreateTab; label: string }[] = [
  { id: "post", label: "กระทู้" },
  { id: "room", label: "ห้อง" },
];

// "+ สร้าง" in the header: post a thread in a room you've joined, or start a
// new room. Posting saves the thread and opens it; the room tab has no
// backend yet, so submitting it just closes the modal.
export default function CreateModal({
  rooms,
  alias,
  initialTab = "post",
  onClose,
}: {
  // Null while the list is still loading.
  rooms: MyRoom[] | null;
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
  rooms: MyRoom[] | null;
  alias: string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const { post, pending, error, clearError } = usePostToRoom();
  const loading = rooms === null;
  const hasRooms = !loading && rooms.length > 0;
  // The chosen room, or the first one if none was chosen.
  const room =
    rooms?.find((item) => item.id === chosenId) ?? rooms?.[0] ?? null;
  const canPost = room !== null && text.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!room || pending) return;
        // Closing the modal also clears what was typed.
        post({ room, content: text, onPosted: onClose });
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="post-room" className={labelClass}>
          ห้อง
        </label>
        <select
          id="post-room"
          name="room"
          disabled={!hasRooms}
          value={room?.id ?? ""}
          onChange={(event) => {
            setChosenId(event.target.value);
            if (error) clearError();
          }}
          className={inputClass}
        >
          {loading && <option value="">กำลังโหลดห้อง…</option>}
          {!loading && !hasRooms && (
            <option value="">ยังไม่ได้เข้าห้องไหน</option>
          )}
          {rooms?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <p className={hintClass}>
          {loading || hasRooms
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
            {text.length} / {MAX_POST_CONTENT_LENGTH}
          </span>
        </div>
        <textarea
          id="post-text"
          name="text"
          rows={4}
          maxLength={MAX_POST_CONTENT_LENGTH}
          placeholder="อะไรก็ได้ตามใจฉัน...."
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) clearError();
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "post-error" : undefined}
          className={`resize-y ${inputClass}`}
        />
      </div>

      {/* No "แนบรูป" yet: there is nowhere to keep pictures, so the control
          comes back once there is. */}
      {alias && (
        <span className="flex w-fit items-center gap-2 rounded-full border-[1.5px] border-butter-edge bg-butter px-3 py-1 text-sm">
          <span aria-hidden="true" className="size-2 rounded-full bg-green-600" />
          โพสต์ในชื่อ <span className="font-semibold">{alias}</span>
        </span>
      )}

      {error && (
        <p id="post-error" role="alert" className={alertClass}>
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={`px-4 py-2 ${secondaryButtonClass}`}>
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={!canPost}
          aria-disabled={pending || undefined}
          className={`flex items-center gap-2 px-4 py-2 ${primaryButtonClass} ${disabledButtonClass} ${pending ? "cursor-wait" : ""}`}
        >
          {pending && <Spinner />}
          {pending ? "กำลังตั้ง…" : "ตั้งกระทู้"}
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
