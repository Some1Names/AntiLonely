// Class strings shared across components.

export const inputClass =
  "w-full rounded-md border border-edge-strong bg-white px-3 py-2 text-sm outline-none focus:border-kmutt-orange focus:ring-3 focus:ring-kmutt-yellow/40";

// Yellow "sticker" button for the main action in a view. It sinks into its
// shadow when pressed.
export const primaryButtonClass =
  "rounded-md bg-kmutt-yellow text-sm font-semibold text-ink shadow-press hover:brightness-105 active:translate-y-0.5 active:shadow-none";

// Highlighter swipe across the lower part of a heading's text. Yellow unless
// the element sets --mark to another color. It draws itself in on arrival
// (see --animate-highlight-draw), or is simply there with reduced motion.
export const highlightClass =
  "box-decoration-clone bg-[linear-gradient(transparent_55%,var(--mark,var(--color-highlight))_55%)] bg-no-repeat px-1 animate-highlight-draw motion-reduce:animate-none";

// Quiet button next to a primary one, such as "ยกเลิก".
export const secondaryButtonClass =
  "rounded-md text-sm font-semibold text-ink-soft hover:bg-butter hover:text-ink";

// A primary sticker button that can't be pressed yet.
export const disabledButtonClass =
  "disabled:cursor-not-allowed disabled:bg-edge disabled:text-ink-soft disabled:shadow-none disabled:hover:brightness-100 disabled:active:translate-y-0";

// A bordered row or card holding a radio. It turns butter with a darker
// border once its radio is checked.
export const choiceClass =
  "flex cursor-pointer gap-3 rounded-md border border-edge-strong bg-white px-3 py-2.5 text-sm hover:bg-cream has-checked:border-kmutt-yellow-dark has-checked:bg-butter has-checked:font-semibold has-focus-visible:ring-3 has-focus-visible:ring-kmutt-yellow/40";

export const radioClass = "size-4 shrink-0 accent-kmutt-orange-dark outline-none";

export const labelClass = "text-sm font-semibold";

export const hintClass = "text-xs text-ink-soft";
