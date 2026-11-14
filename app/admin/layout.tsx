import { Suspense } from "react";
import { connection } from "next/server";
import { AdminSkeleton } from "@/component/PageSkeletons";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AdminSidebar from "@/component/admin/AdminSidebar";
import { auth } from "@/lib/auth";

// Guards every /admin page: no session -> login, not admin/moderator -> 404
// (so the page's existence isn't revealed). Server actions still check on
// their own; this just stops the pages from rendering for other people.
async function AdminGuard({ children }: { children: React.ReactNode }) {
  await connection();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const role = session.user.role;
  if (role !== "admin" && role !== "moderator") notFound();

  return <>{children}</>;
}

export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink lg:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
        <Suspense
          fallback={<AdminSkeleton label="กำลังตรวจสอบสิทธิ์…" />}
        >
          <AdminGuard>{children}</AdminGuard>
        </Suspense>
      </main>
    </div>
  );
}
