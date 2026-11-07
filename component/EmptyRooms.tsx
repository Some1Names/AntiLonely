import Icon from "@/component/Icon";
import { primaryButtonClass } from "@/lib/styles";

// Takes the room grid's place when nothing matches: a blank dashed page in
// the notebook with a magnifier sticker. `query` is the trimmed search text,
// empty when only a filter is narrowing the list.
export default function EmptyRooms({
  query,
  onReset,
}: {
  query: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-edge-strong bg-white/70 px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="mb-2 flex size-14 -rotate-6 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-butter shadow-sticker"
      >
        <Icon name="search" className="size-7" />
      </span>
      <p className="font-display text-xl font-semibold wrap-anywhere">
        {query ? `ไม่เจอห้องที่ตรงกับ “${query}”` : "ยังไม่มีห้องในหมวดนี้"}
      </p>
      <p className="text-sm text-ink-soft">
        {query
          ? "ลองคำอื่นดู หรือกลับไปดูห้องทั้งหมดก่อนก็ได้นะ"
          : "แวะดูห้องอื่น ๆ ไปก่อนนะ"}
      </p>
      <button
        type="button"
        onClick={onReset}
        className={`mt-3 px-4 py-2 ${primaryButtonClass}`}
      >
        {query ? "ล้างการค้นหา" : "ดูทั้งหมด"}
      </button>
    </div>
  );
}
