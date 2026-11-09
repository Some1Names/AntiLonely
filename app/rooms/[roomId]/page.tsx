import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Header from "@/component/Header";
import RoomBoardFeed from "@/component/RoomBoardFeed";
import { rooms } from "@/lib/mock";
import { getMockBoardPosts } from "@/lib/mock/post-thread";

type Props = {
  params: Promise<{
    roomId: string;
  }>;
};

async function RoomBoardFeedContent({ params }: Props) {
  await connection();
  const { roomId } = await params;

  const room = rooms.find((r) => r.id === roomId);

  if (!room) {
    notFound();
  }

  const serverTime = new Date().toISOString();
  const initialPosts = getMockBoardPosts(room.id, Date.parse(serverTime));

  return (
    <RoomBoardFeed
      room={room}
      initialPosts={initialPosts}
      serverTime={serverTime}
    />
  );
}

export default function RoomBoardFeedPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#fafafa]">
          <Header notifications={0} />
        </div>
      }
    >
      <RoomBoardFeedContent params={props.params} />
    </Suspense>
  );
}
