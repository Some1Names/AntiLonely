import Icon, { type IconName } from "@/component/Icon";

// A blank dashed page in the notebook with an icon sticker, standing in for a
// list that has nothing in it yet. Children go underneath, such as a button
// that clears a search.
export default function EmptyNote({
  icon,
  title,
  description,
  children,
}: {
  icon: IconName;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-edge-strong bg-white/70 px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="mb-2 flex size-14 -rotate-6 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-butter shadow-sticker"
      >
        <Icon name={icon} className="size-7" />
      </span>
      <p className="font-display text-xl font-semibold wrap-anywhere">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-ink-soft">{description}</p>
      )}
      {children}
    </div>
  );
}
