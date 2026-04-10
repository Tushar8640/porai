import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatTaka } from "@/lib/utils";
import { PLAN_PRICES } from "@/lib/constants";

export default async function AdminPage() {
  const orgs = await prisma.organization.findMany({
    include: {
      subscription: true,
      _count: { select: { students: { where: { isActive: true } }, users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = orgs.reduce((s, o) => s + (o.subscription?.status === "ACTIVE" ? PLAN_PRICES[o.subscription.plan] : 0), 0);

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
          <p className="text-3xl font-bold text-green-600 mt-1">{formatTaka(totalRevenue)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Coaching Centers</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Center Name</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{o.district ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className="bg-indigo-100 text-indigo-700">{o.subscription?.plan ?? "FREE"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={o.subscription?.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {o.subscription?.status ?? "ACTIVE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{o._count.students}</TableCell>
                  <TableCell className="text-center">{o._count.users}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(o.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
