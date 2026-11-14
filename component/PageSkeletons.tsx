import { indexCardClass, skeletonClass } from "@/lib/styles";

// Grey stand-ins for pages whose content is still on its way, shaped like
// the real thing so nothing jumps when it arrives. Each says "loading" once
// to screen readers and hides its boxes from them. Home has its own
// (HomeSkeleton) and these share its look.

function Line({ className }: { className: string }) {
  // A line of text unless the caller gives it another shape.
  const shape = className.includes("rounded-") ? "" : "rounded-md";
  return <div className={`${shape} ${skeletonClass} ${className}`} />;
}

function Loading({ label }: { label: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  );
}

// A post as an index card: author row, a few lines of text, reactions.
function PostSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className={`flex flex-col gap-3 p-4 sm:p-5 ${indexCardClass}`}>
      <div className="flex items-center gap-3">
        <div className={`size-9 shrink-0 rounded-full ${skeletonClass}`} />
        <div className="flex flex-1 flex-col gap-1.5">
          <Line className="h-4 w-28" />
          <Line className="h-3 w-16" />
        </div>
      </div>
      {Array.from({ length: lines }, (_, index) => (
        <Line
          key={index}
          className={`h-4 ${index === lines - 1 ? "w-3/5" : "w-full"}`}
        />
      ))}
      <div className="flex gap-2 pt-1">
        <Line className="h-7 w-14 rounded-full" />
        <Line className="h-7 w-14 rounded-full" />
        <Line className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}

// /rooms/[roomId]: breadcrumb and the room's taped header card, then the
// composer and posts, with the rules card beside them from lg.
export function RoomSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-1 flex-col">
      <Loading label="กำลังโหลดห้อง…" />
      <div
        aria-hidden="true"
        className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-8 lg:px-12 xl:px-[120px]"
      >
        <Line className="mb-4 h-3 w-40" />
        <div className={`flex items-start gap-4 p-5 pt-6 ${indexCardClass}`}>
          <div className={`size-14 shrink-0 rounded-lg ${skeletonClass}`} />
          <div className="flex flex-1 flex-col gap-2">
            <Line className="h-6 w-48" />
            <Line className="h-4 w-4/5" />
            <Line className="mt-1 h-3 w-36" />
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-start gap-6 px-4 pb-16 pt-6 sm:px-8 lg:flex-row lg:gap-8 lg:px-12 xl:px-[120px]"
      >
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <Line className="h-[52px] w-full rounded-xl" />
          <PostSkeleton lines={3} />
          <PostSkeleton />
          <PostSkeleton />
        </div>
        <div
          className={`hidden w-[300px] shrink-0 flex-col gap-3 p-5 lg:flex ${indexCardClass}`}
        >
          <Line className="h-5 w-28" />
          <Line className="h-4 w-full" />
          <Line className="h-4 w-5/6" />
          <Line className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

// /rooms/[roomId]/posts/[postId]: back link, the post, the reply box and
// a few comments.
export function PostThreadSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto w-full max-w-[760px] flex-1 space-y-4 px-4 pb-16 pt-6 sm:px-6"
    >
      <Loading label="กำลังโหลดกระทู้…" />
      <div aria-hidden="true" className="space-y-4">
        <Line className="h-4 w-32" />
        <PostSkeleton lines={4} />
        <Line className="h-[52px] w-full rounded-xl" />
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex gap-3 pl-2">
            <div className={`size-8 shrink-0 rounded-full ${skeletonClass}`} />
            <div className="flex flex-1 flex-col gap-2">
              <Line className="h-4 w-24" />
              <Line className="h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// /notifications: title and button, the category tabs, then rows.
export function NotificationsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto w-full max-w-[720px] flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-10"
    >
      <Loading label="กำลังโหลดการแจ้งเตือน…" />
      <div aria-hidden="true" className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Line className="h-8 w-40" />
          <Line className="h-8 w-32 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {[16, 20, 20, 16].map((width, index) => (
            <div
              key={index}
              style={{ width: `${width * 4}px` }}
              className={`h-8 rounded-full ${skeletonClass}`}
            />
          ))}
        </div>
        <div className={`divide-y-[1.5px] divide-dashed divide-edge ${indexCardClass}`}>
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="flex items-start gap-3 p-4">
              <div className={`size-9 shrink-0 rounded-full ${skeletonClass}`} />
              <div className="flex flex-1 flex-col gap-2">
                <Line className="h-4 w-4/5" />
                <Line className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// The admin pages: a title, a row of stat cards (dashboard) and a table.
export function AdminSkeleton({
  label,
  stats = false,
}: {
  label: string;
  stats?: boolean;
}) {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <Loading label={label} />
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Line className="h-8 w-56" />
          <Line className="h-4 w-72 max-w-full" />
        </div>
        {stats && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className={`flex flex-col gap-3 p-5 ${indexCardClass}`}>
                <Line className="h-4 w-20" />
                <Line className="h-8 w-14" />
              </div>
            ))}
          </div>
        )}
        <div className={`overflow-hidden ${indexCardClass}`}>
          <div className="flex gap-4 border-b-[1.5px] border-dashed border-edge p-4">
            <Line className="h-4 w-1/4" />
            <Line className="h-4 w-1/5" />
            <Line className="h-4 w-1/6" />
          </div>
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="flex items-center gap-4 p-4">
              <div className={`size-8 shrink-0 rounded-full ${skeletonClass}`} />
              <Line className="h-4 w-1/4" />
              <Line className="h-4 w-1/5" />
              <Line className="ml-auto h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
