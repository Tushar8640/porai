import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">CoachingHub BD — Admin</h1>
          <p className="text-xs text-indigo-200">Super Admin Panel</p>
        </div>
        <p className="text-sm text-indigo-200">{session.user.email}</p>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
