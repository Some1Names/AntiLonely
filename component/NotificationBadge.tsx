"use client";

import { useReadNotificationIds } from "@/component/useReadNotifications";
import { getMockNotificationsFeed } from "@/lib/mock/notifications";

const unreadIds = getMockNotificationsFeed()
  .items.filter((item) => !item.isRead)
  .map((item) => item.id);

// The orange count on the bell. `initial` is what to show until the browser
// has anything saved about what's been read.
export default function NotificationBadge({ initial }: { initial: number }) {
  const read = useReadNotificationIds();
  const count = read ? unreadIds.filter((id) => !read.has(id)).length : initial;
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-kmutt-orange-dark px-1.5 text-xs leading-5 text-white">
      {count}
    </span>
  );
}
