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
