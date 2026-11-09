import EmptyNote from "@/component/EmptyNote";
import { primaryButtonClass } from "@/lib/styles";

// Takes the room grid's place when nothing matches, with a magnifier
// sticker. `query` is the trimmed search text, empty when only a filter is
// narrowing the list.
export default function EmptyRooms({
  query,
  onReset,
}: {
  query: string;
  onReset: () => void;
}) {
  return (
    <EmptyNote
      icon="search"
      title={query ? `ไม่เจอห้องที่ตรงกับ “${query}”` : "ยังไม่มีห้องในหมวดนี้"}
      description={
        query
          ? "ลองคำอื่นดู หรือกลับไปดูห้องทั้งหมดก่อนก็ได้นะ"
          : "แวะดูห้องอื่น ๆ ไปก่อนนะ"
      }
    >
      <button
        type="button"
        onClick={onReset}
        className={`mt-3 px-4 py-2 ${primaryButtonClass}`}
      >
        {query ? "ล้างการค้นหา" : "ดูทั้งหมด"}
      </button>
    </EmptyNote>
  );
}
