// Class strings shared across components. The look is a scrapbook: white
// paper and stickers with an ink outline and a hard shadow (see design.md).

import type { Room } from "@/types/room";

// A text field's frame without padding, for fields that place an icon inside.
export const fieldFrameClass =
  "w-full rounded-lg border-[1.5px] border-edge-strong bg-white text-sm outline-none placeholder:text-ink-soft/70 focus:border-kmutt-orange focus:ring-3 focus:ring-kmutt-yellow/40";

export const inputClass = `${fieldFrameClass} px-3 py-2.5`;

// A text field written on a sticky note: dashed yellow until it's focused.
// Add padding (and room for an icon) where it's used.
export const noteFieldClass =
  "w-full rounded-lg border-[1.5px] border-dashed border-kmutt-yellow-dark/70 bg-white text-sm outline-none placeholder:text-ink-soft/70 focus:border-solid focus:border-kmutt-orange focus:ring-3 focus:ring-kmutt-yellow/40";

// A white index card stuck onto the page, with an ink outline and a soft hard
// shadow: the Home sidebar, posts, room rules, the notification list.
export const indexCardClass =
  "rounded-xl border-[1.5px] border-ink bg-white shadow-[4px_4px_0_var(--color-edge-strong)]";

// Each kind of room has a color for its card's shadow (--tone), its tape and
// its icon tile: blue grey for private rooms (matching their tag), peach for
// new ones, yellow for the rest. The tape sits in a different spot for each
// kind too. Room cards on Home and the top of the room page use it.
export function roomLook(room: Pick<Room, "isPrivate" | "isNew">) {
  if (room.isPrivate)
    return {
      card: "[--tone:var(--color-kmutt-grey)]",
      tile: "border-edge-strong bg-mist",
      tape: "left-1/2 -translate-x-1/2 rotate-2 bg-kmutt-grey/45",
    };
  if (room.isNew)
    return {
      card: "[--tone:var(--color-peach-edge)]",
      tile: "border-peach-edge bg-peach",
      tape: "right-6 rotate-6 bg-peach-edge/80",
    };
  return {
    card: "[--tone:var(--color-kmutt-yellow)]",
    tile: "border-butter-edge bg-butter",
    tape: "left-6 -rotate-6 bg-kmutt-yellow/70",
  };
}

// A round peach sticker holding someone's initial or the user icon.
export const avatarClass =
  "flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink bg-peach font-display font-semibold text-ink shadow-sticker";

// Yellow sticker for the main action in a view. It sinks into its shadow
// when pressed.
export const primaryButtonClass =
  "rounded-lg border-[1.5px] border-ink bg-kmutt-yellow text-sm font-semibold text-ink shadow-sticker hover:bg-highlight active:translate-0.5 active:shadow-none motion-safe:transition-[translate,box-shadow,background-color] motion-safe:duration-100";

// White sticker for actions that stand on their own, such as "สุ่มห้องเลย" or
// signing in with Google.
export const outlineButtonClass =
  "rounded-lg border-[1.5px] border-ink bg-white text-sm font-semibold text-ink shadow-sticker hover:bg-butter active:translate-0.5 active:shadow-none motion-safe:transition-[translate,box-shadow,background-color] motion-safe:duration-100";

// Red sticker for an action that is hard to take back, such as banning a
// user. White on red-700 keeps small text readable.
export const dangerButtonClass =
  "rounded-lg border-[1.5px] border-ink bg-red-700 text-sm font-semibold text-white shadow-sticker hover:bg-red-800 active:translate-0.5 active:shadow-none motion-safe:transition-[translate,box-shadow,background-color] motion-safe:duration-100";

// A white sticker chip that stays pressed in, yellow and flat, while it's on:
// toggle buttons (aria-pressed) such as the room filters and reactions, or
// tabs (aria-selected) such as the notification categories.
export const stickerToggleClass =
  "rounded-full border-[1.5px] border-ink bg-white text-sm font-medium shadow-sticker hover:bg-butter aria-pressed:translate-0.5 aria-pressed:bg-kmutt-yellow aria-pressed:shadow-none aria-selected:translate-0.5 aria-selected:bg-kmutt-yellow aria-selected:shadow-none motion-safe:transition-[translate,box-shadow,background-color] motion-safe:duration-100";

// Pill tabs: a cream track with the chosen tab as a yellow sticker inside
// (the create modal, the profile).
export const tabListClass =
  "inline-flex gap-1 rounded-full border-[1.5px] border-ink bg-cream p-1";

export const tabClass =
  "rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-soft hover:text-ink aria-selected:bg-kmutt-yellow aria-selected:text-ink aria-selected:ring-[1.5px] aria-selected:ring-ink";

// Highlighter swipe across the lower part of a heading's text. Yellow unless
// the element sets --mark to another color. It draws itself in on arrival
// (see --animate-highlight-draw), or is simply there with reduced motion.
export const highlightClass =
  "box-decoration-clone bg-[linear-gradient(transparent_55%,var(--mark,var(--color-highlight))_55%)] bg-no-repeat px-1 animate-highlight-draw motion-reduce:animate-none";

// Quiet button next to a primary one, such as "ยกเลิก".
export const secondaryButtonClass =
  "rounded-lg text-sm font-semibold text-ink-soft hover:bg-butter hover:text-ink";

// A sticker that can't be pressed yet: flat and grey, without its shadow.
export const disabledButtonClass =
  "disabled:cursor-not-allowed disabled:border-edge-strong disabled:bg-edge disabled:text-ink-soft disabled:shadow-none disabled:hover:bg-edge disabled:active:translate-0";

// A bordered row or card holding a radio. Once its radio is checked it turns
// into a butter sticker with an ink outline.
export const choiceClass =
  "flex cursor-pointer gap-3 rounded-lg border-[1.5px] border-edge-strong bg-white px-3 py-2.5 text-sm hover:bg-cream has-checked:border-ink has-checked:bg-butter has-checked:font-semibold has-checked:shadow-sticker has-focus-visible:ring-3 has-focus-visible:ring-kmutt-yellow/40";

export const radioClass = "size-4 shrink-0 accent-kmutt-orange-dark outline-none";

export const labelClass = "text-sm font-semibold";

export const hintClass = "text-xs text-ink-soft";

// A form-level error, such as a failed login.
export const alertClass =
  "rounded-lg border-[1.5px] border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700";

// A grey paper block standing in for content that's still loading. It
// breathes gently, or just sits there with reduced motion. Give it a size
// and, where it stands for text, a rounded-full shape.
export const skeletonClass =
  "rounded-md bg-edge/70 motion-safe:animate-pulse";
