import { Suspense } from 'react';
import { connection } from 'next/server';
import Header from '@/component/Header';
import { getMockPostThread } from '@/lib/mock/post-thread';
import { PostThreadClient } from '@/component/post-thread/PostThreadClient';

export const metadata = {
  title: 'กระทู้สนทนา | AntiLonely',
  description: 'อ่านกระทู้ แสดงความคิดเห็น และส่งรีแอคชันในห้องสนทนา',
};

interface PostThreadPageProps {
  params: Promise<{
    roomId: string;
    postId: string;
  }>;
}

async function PostThreadContent({ params }: PostThreadPageProps) {
  await connection();
  const { roomId, postId } = await params;
  const feed = getMockPostThread(roomId, postId);

  return (
    <PostThreadClient
      key={feed.thread.id}
      initialThread={feed.thread}
      currentUser={feed.currentUser}
      serverTime={feed.serverTime}
    />
  );
}

export default function PostThreadPage(props: PostThreadPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#fafafa]">
          <Header notifications={0} />
        </div>
      }
    >
      <PostThreadContent params={props.params} />
    </Suspense>
  );
}

