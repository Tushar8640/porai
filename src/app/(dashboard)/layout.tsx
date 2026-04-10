import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, organizationId, name, email } = session.user;

  if (role === "STUDENT") redirect("/student-portal");
  if (role === "SUPER_ADMIN") redirect("/admin");

  const org = organizationId
    ? await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true, subscription: { select: { plan: true, status: true, endDate: true } } },
      })
    : null;

  const orgName = org?.name ?? "CoachingHub BD";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar role={role} orgName={orgName} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center h-16 bg-white border-b border-gray-200 px-4 lg:px-6 gap-3">
          {/* Mobile sidebar trigger */}
          <div className="lg:hidden">
            <MobileSidebar role={role} orgName={orgName} />
          </div>
          <div className="flex-1" />
          <Topbar userName={name ?? "User"} userEmail={email ?? ""} />
        </div>

        {/* Subscription expired banner */}
        {org?.subscription?.status === "EXPIRED" && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700 flex items-center justify-between">
            <span>Your subscription has expired. Some features may be limited.</span>
            <a href="/settings/subscription" className="font-semibold underline ml-2">Upgrade Now</a>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
