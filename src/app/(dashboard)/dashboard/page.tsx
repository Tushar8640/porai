import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, CalendarCheck, Wallet, TrendingUp } from "lucide-react";
import { formatTaka, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const organizationId = session?.user?.organizationId!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalStudents, activeBatches, todayAtt, monthlyDues, newStudents, recentPayments, subscription] = await Promise.all([
    prisma.student.count({ where: { organizationId, isActive: true } }),
    prisma.batch.count({ where: { organizationId, isActive: true } }),
    prisma.attendance.groupBy({ by: ["status"], where: { organizationId, date: today }, _count: true }),
    prisma.feeRecord.aggregate({ where: { organizationId, status: { in: ["DUE", "PARTIAL"] } }, _sum: { amount: true, paid: true, discount: true } }),
    prisma.student.count({ where: { organizationId, isActive: true, createdAt: { gte: monthStart } } }),
    prisma.feeRecord.findMany({ where: { organizationId, status: { in: ["PAID", "PARTIAL"] }, paidAt: { not: null } }, include: { student: { select: { name: true } }, batch: { select: { name: true } } }, orderBy: { paidAt: "desc" }, take: 5 }),
    prisma.subscription.findUnique({ where: { organizationId }, select: { plan: true, status: true, endDate: true } }),
  ]);

  const present = todayAtt.find(a => a.status === "PRESENT")?._count ?? 0;
  const late = todayAtt.find(a => a.status === "LATE")?._count ?? 0;
  const total = todayAtt.reduce((s, a) => s + a._count, 0);
  const attRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  const totalDues = Number(monthlyDues._sum.amount ?? 0) - Number(monthlyDues._sum.discount ?? 0) - Number(monthlyDues._sum.paid ?? 0);

  const stats = [
    { label: "Total Students", value: totalStudents, sub: `+${newStudents} this month`, icon: Users, color: "text-indigo-600 bg-indigo-50" },
    { label: "Active Batches", value: activeBatches, sub: "currently running", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
    { label: "Today's Attendance", value: `${attRate}%`, sub: `${total} students marked`, icon: CalendarCheck, color: "text-green-600 bg-green-50" },
    { label: "Outstanding Dues", value: formatTaka(totalDues), sub: "to be collected", icon: Wallet, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {session?.user?.name}</p>
      </div>

      {/* Subscription warning */}
      {subscription && subscription.status !== "ACTIVE" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-amber-800">Subscription plan: <strong>{subscription.plan}</strong> — {subscription.status}</p>
          <a href="/settings/subscription" className="text-sm font-semibold text-amber-700 underline">Manage Plan</a>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.student.name}</p>
                    <p className="text-xs text-gray-400">{p.batch?.name} • {p.feeMonth}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{formatTaka(p.paid.toString())}</p>
                    <p className="text-xs text-gray-400">{p.paidAt ? formatDate(p.paidAt) : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
