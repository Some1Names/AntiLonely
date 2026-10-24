// A strip of washi tape stuck over the top edge of a paper card. The card
// needs `relative`.
export default function Tape({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 bg-peach-edge/70 ${className}`}
    />
  );
}
