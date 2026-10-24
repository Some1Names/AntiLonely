import { Suspense } from 'react';
import { connection } from 'next/server';
import { getMockPostThread } from '@/lib/mock/post-thread';
import { PostThreadClient } from '@/components/post-thread/PostThreadClient';

export const metadata = {
  title: 'กระทู้สนทนา | AntiLonely',
  description: 'อ่านกระทู้ แสดงความคิดเห็น และส่งรีแอคชันในห้องสนทนา',
};

interface PostThreadPageProps {
  params: Promise<{
    boardSlug: string;
    postId: string;
  }>;
}

async function PostThreadContent({ params }: PostThreadPageProps) {
  await connection();
  const { boardSlug, postId } = await params;
  const feed = getMockPostThread(boardSlug, postId);

  return (
    <PostThreadClient
      initialThread={feed.thread}
      currentUser={feed.currentUser}
      serverTime={feed.serverTime}
    />
  );
}

export default function PostThreadPage(props: PostThreadPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <PostThreadContent params={props.params} />
    </Suspense>
  );
}

