import AdminSidebar from "@/component/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-10">{children}</main>
    </div>
  );
}