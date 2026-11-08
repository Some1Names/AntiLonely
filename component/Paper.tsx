import Tape from "@/component/Tape";

// A white sheet with an ink outline, lying on a tilted butter sheet so the
// two read as a little stack of paper, taped at the top. The login and signup
// cards and the modal sheets are made of it.
export default function Paper({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-1 translate-y-1.5 rotate-[1.5deg] rounded-2xl border-[1.5px] border-ink bg-butter"
      />
      <div className="relative rounded-2xl border-[1.5px] border-ink bg-white p-6 sm:p-7">
        <Tape />
        {children}
      </div>
    </div>
  );
}
