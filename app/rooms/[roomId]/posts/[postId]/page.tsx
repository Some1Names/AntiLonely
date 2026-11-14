import { Suspense } from 'react';
import { connection } from 'next/server';
import { PostThreadSkeleton } from '@/component/PageSkeletons';
import { notFound, redirect } from 'next/navigation';
import Header from '@/component/Header';
import { PostThreadClient } from '@/component/post-thread/PostThreadClient';
import { getPostThreadData } from './actions';

export const metadata = {
  title: 'กระทู้สนทนา | AntiLonely',
  description: 'อ่านกระทู้ แสดงความคิดเห็น และส่งรีแอคชันในห้องสนทนา',
};

export const instant = false;

interface PostThreadPageProps {
  params: Promise<{
    roomId: string;
    postId: string;
  }>;
}

async function PostThreadContent({ params }: PostThreadPageProps) {
  await connection();
  const { roomId, postId } = await params;

  const data = await getPostThreadData(roomId, postId);
  if (!data) {
    notFound();
  }

  if (data.room.isPrivate && data.memberStatus !== 'active') {
    redirect(`/rooms/${data.room.slug}`);
  }

  if (roomId !== data.room.slug || postId !== data.thread.id) {
    redirect(`/rooms/${data.room.slug}/posts/${data.thread.id}`);
  }

  return (
    <PostThreadClient
      key={data.thread.id}
      room={data.room}
      memberStatus={data.memberStatus}
      canComment={data.canComment}
      canReact={data.canReact}
      initialThread={data.thread}
      currentUser={data.currentUser}
      myRooms={data.myRooms}
      serverTime={data.serverTime}
    />
  );
}

export default function PostThreadPage(props: PostThreadPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Header notifications={0} rooms={[]} alias="ผู้เยี่ยมชม" />
          <PostThreadSkeleton />
        </div>
      }
    >
      <PostThreadContent params={props.params} />
    </Suspense>
  );
}
