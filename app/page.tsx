import Header from "@/component/Header";
import PostBox from "@/component/PostBox";
import RoomList from "@/component/RoomList";
import Sidebar from "@/component/Sidebar";
import { currentUser, myRooms, rooms } from "@/lib/mock";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header notifications={currentUser.notifications} />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr] lg:grid-cols-[1fr_3fr]">
        <Sidebar rooms={myRooms} />
        <main className="flex min-w-0 flex-col gap-6">
          <input
            type="search"
            aria-label="ค้นหา"
            placeholder="ค้นหาห้องหรือกระทู้..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
          <PostBox username={currentUser.name} rooms={myRooms} />
          <RoomList
            rooms={rooms}
            memberRoomIds={myRooms.map((room) => room.id)}
          />
        </main>
      </div>
    </div>
  );
}
