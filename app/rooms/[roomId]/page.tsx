
import { notFound } from "next/navigation";
import RoomBoardFeed from "@/component/RoomBoardFeed";
import { rooms } from "@/lib/mock";

type Props = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function RoomBoardFeedPage({ params }: Props) {
  const { roomId } = await params;

  const room = rooms.find((r) => r.id === roomId);

  if (!room) {
    notFound();
  }

  return <RoomBoardFeed room={room} />;
}
