// A strip of washi tape stuck over the top edge of a paper card. The card
// needs `relative`. `className` sets where the strip sits, its size, tilt and
// color; leave it out for the default strip, top center in peach.
export default function Tape({
  className = "left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 bg-peach-edge/70",
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`washi pointer-events-none absolute -top-3 ${className}`}
    />
  );
}
