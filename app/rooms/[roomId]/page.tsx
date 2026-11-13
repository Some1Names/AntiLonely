import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import Header from "@/component/Header";
import RoomBoardFeed from "@/component/RoomBoardFeed";
import { getRoomBoardData } from "./actions";

type Props = {
  params: Promise<{
    roomId: string;
  }>;
};

export const instant = false;

async function RoomBoardFeedContent({ params }: Props) {
  await connection();
  const { roomId } = await params;

  const data = await getRoomBoardData(roomId);
  if (!data) {
    notFound();
  }
  if (roomId !== data.room.slug) {
    redirect(`/rooms/${data.room.slug}`);
  }

  return (
    <RoomBoardFeed
      room={data.room}
      initialPosts={data.initialPosts}
      initialMembership={data.membership}
      currentUser={data.currentUser}
      myRooms={data.myRooms}
      serverTime={data.serverTime}
    />
  );
}

export default function RoomBoardFeedPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col">
          <Header notifications={0} />
        </div>
      }
    >
      <RoomBoardFeedContent params={props.params} />
    </Suspense>
  );
}
