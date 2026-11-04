import Header from "@/component/Header";
import HomeMain from "@/component/HomeMain";
import PostBox from "@/component/PostBox";
import Sidebar from "@/component/Sidebar";
import { currentUser, myRooms, rooms } from "@/lib/mock";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Header notifications={currentUser.notifications} />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr] lg:grid-cols-[1fr_3fr]">
        <Sidebar rooms={myRooms} />
        <HomeMain
          rooms={rooms}
          memberRoomIds={myRooms.map((room) => room.id)}
        >
          <PostBox username={currentUser.name} rooms={myRooms} />
        </HomeMain>
      </div>
    </div>
  );
}
