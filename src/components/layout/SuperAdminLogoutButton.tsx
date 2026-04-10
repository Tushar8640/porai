"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SuperAdminLogoutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 rounded-md border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign Out
    </button>
  );
}