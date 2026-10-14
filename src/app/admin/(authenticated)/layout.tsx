import { requireAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebarNav } from "./AdminSidebarNav";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await requireAdminSession())) redirect("/login");
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans print:bg-white print:block">
      {/* Navigation (Responsive Mobile Burger Bar + Desktop Sidebar) */}
      <AdminSidebarNav />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
        {children}
      </main>
    </div>
  );
}
