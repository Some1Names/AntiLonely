import Tape from "@/component/Tape";

// A plain sheet of paper for a modal: tape on top, a handwritten title and
// room on the right for the modal's × button.
export default function Sheet({
  titleId,
  title,
  children,
}: {
  titleId: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xs border border-edge bg-white p-6 shadow-paper">
      <Tape />
      <h2 id={titleId} className="pr-8 font-display text-2xl font-semibold">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}
