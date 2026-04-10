import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BANGLADESH_DISTRICTS, PLAN_STUDENT_LIMITS, PLAN_PRICES } from "@/lib/constants";
import { formatTaka } from "@/lib/utils";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const organizationId = session.user.organizationId;

  const [org, sub] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.subscription.findUnique({ where: { organizationId } }),
  ]);

  if (!org) redirect("/login");

  const studentCount = await prisma.student.count({ where: { organizationId, isActive: true } });

  return (
    <div>
      <PageHeader title="Settings" description="Manage your coaching center settings" />
      <Tabs defaultValue="general" className="max-w-2xl">
        <TabsList><TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="subscription">Subscription</TabsTrigger></TabsList>

        <TabsContent value="general" className="mt-4">
          <SettingsForm org={{ id: org.id, name: org.name, phone: org.phone ?? "", address: org.address ?? "", district: org.district ?? "" }} districts={[...BANGLADESH_DISTRICTS]} />
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700">{sub?.plan ?? "FREE"}</Badge>
                <Badge className={sub?.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{sub?.status ?? "ACTIVE"}</Badge>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Monthly Fee: <strong>{formatTaka(PLAN_PRICES[sub?.plan ?? "FREE"])}</strong></p>
                <p>Student Limit: <strong>{PLAN_STUDENT_LIMITS[sub?.plan ?? "FREE"] === Infinity ? "Unlimited" : PLAN_STUDENT_LIMITS[sub?.plan ?? "FREE"]}</strong></p>
                <p>Current Students: <strong>{studentCount}</strong></p>
                {sub?.endDate && <p>Valid Until: <strong>{new Date(sub.endDate).toLocaleDateString("en-GB")}</strong></p>}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Available Plans</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["FREE", "BASIC", "PRO"] as const).map(plan => (
                    <div key={plan} className={`p-3 rounded-lg border ${sub?.plan === plan ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                      <p className="font-bold text-sm">{plan}</p>
                      <p className="text-xs text-gray-500 mt-1">Up to {PLAN_STUDENT_LIMITS[plan] === Infinity ? "∞" : PLAN_STUDENT_LIMITS[plan]} students</p>
                      <p className="text-sm font-semibold text-indigo-700 mt-1">{PLAN_PRICES[plan] === 0 ? "Free" : formatTaka(PLAN_PRICES[plan]) + "/mo"}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">To upgrade your plan, contact support at support@coachinghub.bd</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
