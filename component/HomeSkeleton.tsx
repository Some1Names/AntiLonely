import { indexCardClass, skeletonClass } from "@/lib/styles";

// Home while its rooms are on their way: the same sidebar card, search bar,
// welcome note and room card grid, in grey, so nothing jumps when the real
// ones arrive. Screen readers hear one "loading" line, not the empty boxes.
export default function HomeSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr] lg:grid-cols-[1fr_3fr]"
    >
      <p role="status" className="sr-only">
        กำลังโหลดห้อง…
      </p>
      <div
        aria-hidden="true"
        className={`flex flex-col gap-2 self-start p-3 ${indexCardClass}`}
      >
        <div className="mb-1 border-b-[1.5px] border-dashed border-edge px-2 pb-2">
          <div className={`h-5 w-24 rounded-md ${skeletonClass}`} />
        </div>
        <div className={`mx-2 h-4 w-4/5 rounded-md ${skeletonClass}`} />
        <div className={`mt-2 h-10 rounded-lg ${skeletonClass}`} />
      </div>
      <div aria-hidden="true" className="flex min-w-0 flex-col gap-6">
        <div
          className={`h-[42px] rounded-lg border-[1.5px] border-edge-strong bg-white shadow-[3px_3px_0_var(--color-edge)]`}
        />
        <div className="-rotate-[0.4deg] rounded-lg border-[1.5px] border-ink bg-butter p-6 shadow-sticker-lg sm:p-7">
          <div className={`h-8 w-3/5 bg-butter-edge rounded-md ${skeletonClass}`} />
          <div className={`mt-3 h-4 w-11/12 bg-butter-edge rounded-md ${skeletonClass}`} />
          <div className={`mt-5 h-[42px] rounded-lg bg-butter-edge ${skeletonClass}`} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className={`h-8 w-32 rounded-md ${skeletonClass}`} />
            <div className="flex gap-2">
              {[16, 20, 20].map((width, index) => (
                <div
                  key={index}
                  style={{ width: `${width * 4}px` }}
                  className={`h-8 rounded-full ${skeletonClass}`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <RoomCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Shaped like RoomCard: tile, name and description, then the stats and the
// join button under a dashed line.
function RoomCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border-[1.5px] border-edge-strong bg-white p-4 pt-5 shadow-[4px_4px_0_var(--color-edge)]">
      <div className="flex items-start gap-3">
        <div className={`size-11 shrink-0 rounded-lg ${skeletonClass}`} />
        <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
          <div className={`h-5 w-1/2 rounded-md ${skeletonClass}`} />
          <div className={`h-4 w-5/6 rounded-md ${skeletonClass}`} />
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t-[1.5px] border-dashed border-edge pt-3">
        <div className={`h-4 w-40 rounded-md ${skeletonClass}`} />
        <div className={`h-8 w-20 rounded-lg ${skeletonClass}`} />
      </div>
    </div>
  );
}
