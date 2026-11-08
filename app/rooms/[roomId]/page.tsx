import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Header from "@/component/Header";
import RoomBoardFeed from "@/component/RoomBoardFeed";
import { rooms } from "@/lib/mock";

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

  return <RoomBoardFeed room={room} />;
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
