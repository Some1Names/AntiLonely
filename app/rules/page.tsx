import type { Metadata } from "next";
import Link from "next/link";
import { AuthLink } from "@/component/AuthCard";
import CommunityRules from "@/component/CommunityRules";
import Header from "@/component/Header";
import Paper from "@/component/Paper";
import { currentUser, myRooms } from "@/lib/mock";
import { highlightClass, outlineButtonClass, primaryButtonClass } from "@/lib/styles";

export const metadata: Metadata = {
  title: "กติกาของชุมชน | AntiLonely",
};

// The community rules on their own page, for a direct link or a new tab. The
// signup form shows the same rules in place instead (see SignupForm), so
// reading them there doesn't lose what was typed.
export default function RulesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header
        notifications={currentUser.notifications}
        rooms={myRooms}
        alias={currentUser.alias}
      />
      <main className="flex flex-1 justify-center px-4 py-10">
        <Paper className="w-full max-w-2xl">
          <h1 className="font-display text-[1.75rem] leading-tight font-semibold">
            <span className={highlightClass}>กติกาของชุมชน</span>
          </h1>
          <div className="mt-5">
            <CommunityRules />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 border-t-[1.5px] border-dashed border-edge pt-5">
            <Link href="/" className={`inline-flex px-5 py-2.5 ${primaryButtonClass}`}>
              กลับหน้าแรก
            </Link>
            {/* A full load, like the auth pages' own links. */}
            <AuthLink
              href="/signup"
              inModal={false}
              className={`inline-flex px-5 py-2.5 ${outlineButtonClass}`}
            >
              ไปสมัครสมาชิก
            </AuthLink>
          </div>
        </Paper>
      </main>
    </div>
  );
}
