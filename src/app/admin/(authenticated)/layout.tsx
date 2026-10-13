import Link from "next/link";
import { LogOut, LayoutDashboard, ShoppingBag, Settings, PackageOpen } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { requireAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await requireAdminSession())) redirect("/login");
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans print:bg-white print:block">
      {/* Sidebar */}
      <aside className="w-full md:w-56 lg:w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 print:hidden">
        <div className="p-4 lg:p-5 border-b border-gray-100 flex items-center justify-between">
          <Link href="/admin" className="font-serif text-xl font-bold text-brand-green tracking-tight">
            Pink Farm Admin
          </Link>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-pink/40 hover:text-brand-green text-sm font-medium transition-colors">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-pink/40 hover:text-brand-green text-sm font-medium transition-colors">
            <ShoppingBag size={18} />
            <span>Orders</span>
          </Link>
          <Link href="/admin/products" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-pink/40 hover:text-brand-green text-sm font-medium transition-colors">
            <PackageOpen size={18} />
            <span>Products</span>
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-pink/40 hover:text-brand-green text-sm font-medium transition-colors">
            <Settings size={18} />
            <span>Store Settings</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
        {children}
      </main>
    </div>
  );
}
