
import { rooms } from "@/lib/mock";
import RoomBoardFeed from "@/component/RoomBoardFeed";

export default function BoardFeedPage() {
  const room = rooms.find((r) => r.id === "songs");

  if (!room) {
    return <div className="p-10 text-center">ไม่พบห้องนี้</div>;
  }

  return <RoomBoardFeed room={room} />;
}
