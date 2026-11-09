
import { rooms } from "@/lib/mock";
import { getMockBoardPosts } from "@/lib/mock/post-thread";
import RoomBoardFeed from "@/component/RoomBoardFeed";

export default function BoardFeedPage() {
  const room = rooms.find((r) => r.id === "songs");

  if (!room) {
    return <div className="p-10 text-center">ไม่พบห้องนี้</div>;
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
