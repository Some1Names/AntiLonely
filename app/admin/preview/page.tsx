import { notFound } from "next/navigation";
import SanctionPreview from "@/component/admin/SanctionPreview";

// Development-only page for trying the admin dialogs before the admin panel
// exists. Uses fake users and fake actions, so nothing is saved.
export default function AdminPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SanctionPreview />;
}
