import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/component/Header";
import HomeMain from "@/component/HomeMain";
import HomeSkeleton from "@/component/HomeSkeleton";
import PostBox from "@/component/PostBox";
import RoomMembership from "@/component/RoomMembership";
import Sidebar from "@/component/Sidebar";
import { getHomeData } from "@/lib/home-data";

// The rooms, who has joined what and the unread count are read per request, so
// the page streams in behind the header.
export const instant = false;

async function HomeContent() {
  await connection();
  const { rooms, myRooms, viewer } = await getHomeData();

  return (
    // Joining and leaving rooms is shared by the sidebar, the room cards and
    // their modals.
    <RoomMembership myRooms={myRooms} rooms={rooms} signedIn={viewer !== null}>
      <div className="flex flex-1 flex-col">
        <Header
          notifications={viewer?.notifications ?? 0}
          rooms={myRooms}
          alias={viewer?.alias ?? ""}
        />
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr] lg:grid-cols-[1fr_3fr]">
          <Sidebar />
          <HomeMain rooms={rooms}>
            <PostBox name={viewer?.name ?? null} rooms={myRooms} />
          </HomeMain>
        </div>
      </div>
    </RoomMembership>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col">
          <Header notifications={0} rooms={[]} alias="" />
          <HomeSkeleton />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
