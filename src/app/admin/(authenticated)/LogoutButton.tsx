"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleLogout}
        type="button"
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-rose-700 bg-white/95 backdrop-blur-md hover:bg-rose-50 border border-rose-200/90 text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer ${className}`}
        title="Sign out of Admin Dashboard"
      >
        <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <LogOut size={11} />
        </div>
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      type="button"
      className={`group flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/60 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-[0.98] ${className}`}
      title="Sign out of Admin Dashboard"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <LogOut size={14} />
        </div>
        <span className="font-semibold text-gray-800 group-hover:text-rose-800 transition-colors">Sign Out</span>
      </div>
      <span className="text-[10px] text-rose-400 group-hover:text-rose-600 font-normal">Exit</span>
    </button>
  );
}
