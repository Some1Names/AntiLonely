import Paper from "@/component/Paper";

// A modal's sheet: a little stack of paper with tape on top, a handwritten
// title, and room on the right for the modal's × button.
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
    <Paper>
      <h2 id={titleId} className="pr-10 font-display text-2xl font-semibold">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </Paper>
  );
}
