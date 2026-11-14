import { Suspense } from 'react';
import { redirect } from "next/navigation";
import { connection } from 'next/server';
import { NotificationsSkeleton } from '@/component/PageSkeletons';
import Header from '@/component/Header';
import { NotificationsClient } from '@/component/notifications/NotificationsClient';
import { getNotificationItems } from "@/lib/notifications-data";
import { getViewerUser } from "@/lib/server-action-helpers";

export const metadata = {
  title: 'การแจ้งเตือน | AntiLonely',
  description: 'ศูนย์รวมการแจ้งเตือนสำหรับผู้ใช้งาน',
};

async function NotificationsFeed() {
  await connection();
  const viewer = await getViewerUser();
  if (!viewer) redirect("/login");

  const feed = await getNotificationItems(viewer.id);

  return (
    <NotificationsClient
      initialItems={feed.items}
      serverTime={feed.serverTime}
    />
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col">
          <Header notifications={0} rooms={[]} alias="" />
          <NotificationsSkeleton />
        </div>
      }
    >
      <NotificationsFeed />
    </Suspense>
  );
}
