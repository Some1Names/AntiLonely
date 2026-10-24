import { primaryButtonClass } from "@/lib/styles";

// Takes the room grid's place when nothing matches: a blank dashed page in
// the notebook. `query` is the trimmed search text, empty when only a filter
// is narrowing the list.
export default function EmptyRooms({
  query,
  onReset,
}: {
  query: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xs border-[1.5px] border-dashed border-edge-strong bg-white/60 px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold wrap-anywhere">
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
        className={`mt-2 px-4 py-2 ${primaryButtonClass}`}
      >
        {query ? "ล้างการค้นหา" : "ดูทั้งหมด"}
      </button>
    </div>
  );
}
