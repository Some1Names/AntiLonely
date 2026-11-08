// Class strings shared across components. The look is a scrapbook: white
// paper and stickers with an ink outline and a hard shadow (see design.md).

// A text field's frame without padding, for fields that place an icon inside.
export const fieldFrameClass =
  "w-full rounded-lg border-[1.5px] border-edge-strong bg-white text-sm outline-none placeholder:text-ink-soft/70 focus:border-kmutt-orange focus:ring-3 focus:ring-kmutt-yellow/40";

export const inputClass = `${fieldFrameClass} px-3 py-2.5`;

// Yellow sticker for the main action in a view. It sinks into its shadow
// when pressed.
export const primaryButtonClass =
  "rounded-lg border-[1.5px] border-ink bg-kmutt-yellow text-sm font-semibold text-ink shadow-sticker hover:bg-highlight active:translate-0.5 active:shadow-none motion-safe:transition-[translate,box-shadow,background-color] motion-safe:duration-100";

// White sticker for actions that stand on their own, such as "สุ่มห้องเลย" or
// signing in with Google.
export const outlineButtonClass =
  "rounded-lg border-[1.5px] border-ink bg-white text-sm font-semibold text-ink shadow-sticker hover:bg-butter active:translate-0.5 active:shadow-none motion-safe:transition-[translate,box-shadow,background-color] motion-safe:duration-100";

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
