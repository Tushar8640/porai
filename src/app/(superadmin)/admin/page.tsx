import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOrgTable, RevenueStats } from "./AdminClient";

export default async function AdminPage() {
  const orgs = await prisma.organization.findMany({
    include: {
      subscription: true,
      _count: { select: { students: { where: { isActive: true } }, users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Overview</h2>
        <p className="text-gray-500 text-sm">{orgs.length} coaching centers registered</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-5">
          <p className="text-sm text-gray-500">Total Centers</p>
          <p className="text-3xl font-bold text-indigo-700 mt-1">{orgs.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-3xl font-bold text-indigo-700 mt-1">{orgs.reduce((s, o) => s + o._count.students, 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-sm text-gray-500">Monthly Revenue</p>
          <RevenueStats orgs={orgs} />
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Coaching Centers</CardTitle></CardHeader>
        <CardContent className="p-0">
          <AdminOrgTable orgs={orgs} />
        </CardContent>
      </Card>
    </div>
  );
}
