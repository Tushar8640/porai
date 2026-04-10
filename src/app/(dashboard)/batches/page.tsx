import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, BookOpen, Clock } from "lucide-react";
import { formatTaka } from "@/lib/utils";

export default async function BatchesPage() {
  const session = await auth();
  const organizationId = session?.user?.organizationId!;

  const batches = await prisma.batch.findMany({
    where: { organizationId, isActive: true },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { enrollments: { where: { isActive: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Batches" description="Manage class batches and groups">
        <Link href="/batches/new">
          <Button><Plus className="mr-2 h-4 w-4" />New Batch</Button>
        </Link>
      </PageHeader>

      {batches.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No batches yet. Create your first batch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(b => (
            <Link key={b.id} href={`/batches/${b.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{b.name}</CardTitle>
                  {b.subject && <p className="text-xs text-gray-500">{b.subject}</p>}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{b._count.enrollments} students</span>
                  </div>
                  {b.schedule && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />{b.schedule}
                    </div>
                  )}
                  {b.teacher && (
                    <div className="text-sm text-gray-600">Teacher: {b.teacher.name}</div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <Badge className="bg-indigo-100 text-indigo-700">{formatTaka(b.monthlyFee.toString())}/mo</Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
