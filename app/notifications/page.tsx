import { Suspense } from 'react';
import { connection } from 'next/server';
import Header from '@/component/Header';
import { NotificationsClient } from '@/component/notifications/NotificationsClient';
import { currentUser, myRooms } from '@/lib/mock';
import { getMockNotificationsFeed } from '@/lib/mock/notifications';

export const metadata = {
  title: 'การแจ้งเตือน | AntiLonely',
  description: 'ศูนย์รวมการแจ้งเตือนสำหรับผู้ใช้งาน',
};

async function NotificationsFeed() {
  await connection();
  const feed = getMockNotificationsFeed();

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
          <Header notifications={0} rooms={myRooms} alias={currentUser.alias} />
        </div>
      }
    >
      <NotificationsFeed />
    </Suspense>
  );
}
