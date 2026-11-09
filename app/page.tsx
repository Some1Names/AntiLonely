import Header from "@/component/Header";
import HomeMain from "@/component/HomeMain";
import PostBox from "@/component/PostBox";
import RoomMembership from "@/component/RoomMembership";
import Sidebar from "@/component/Sidebar";
import { currentUser, myRooms, rooms } from "@/lib/mock";

export default function Home() {
  return (
    // Joining and leaving rooms is shared by the sidebar, the room cards and
    // their modals.
    <RoomMembership myRooms={myRooms} rooms={rooms}>
      <div className="flex flex-1 flex-col">
        <Header
          notifications={currentUser.notifications}
          rooms={myRooms}
          alias={currentUser.alias}
        />
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr] lg:grid-cols-[1fr_3fr]">
          <Sidebar rooms={myRooms} alias={currentUser.alias} />
          <HomeMain rooms={rooms}>
            <PostBox username={currentUser.name} rooms={myRooms} />
          </HomeMain>
        </div>
      </div>
    </RoomMembership>
  );
}
