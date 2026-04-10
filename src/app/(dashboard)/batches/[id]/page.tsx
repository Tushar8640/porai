import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck, Users, Clock, BookOpen } from "lucide-react";
import { formatTaka } from "@/lib/utils";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const organizationId = session?.user?.organizationId!;

  const batch = await prisma.batch.findFirst({
    where: { id, organizationId },
    include: {
      teacher: { select: { name: true } },
      enrollments: {
        where: { isActive: true },
        include: { student: { select: { id: true, studentId: true, name: true, gender: true, guardianPhone: true } } },
      },
    },
  });

  if (!batch) notFound();

  return (
    <div>
      <PageHeader title={batch.name} description={batch.subject ?? "Batch Details"}>
        <Link href={`/attendance?batchId=${id}`}>
          <Button variant="outline"><CalendarCheck className="mr-2 h-4 w-4" />Mark Attendance</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Batch Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />{batch.enrollments.length} students enrolled
            </div>
            {batch.schedule && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />{batch.schedule}
              </div>
            )}
            {batch.subject && (
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="h-4 w-4" />{batch.subject}
              </div>
            )}
            {batch.teacher && <div className="text-gray-600">Teacher: <span className="font-medium">{batch.teacher.name}</span></div>}
            <div><Badge className="bg-indigo-100 text-indigo-700">Monthly Fee: {formatTaka(batch.monthlyFee.toString())}</Badge></div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enrolled Students ({batch.enrollments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {batch.enrollments.length === 0 ? (
                <p className="text-sm text-gray-400">No students enrolled yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Gender</TableHead><TableHead>Guardian Phone</TableHead><TableHead></TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.enrollments.map(e => (
                      <TableRow key={e.student.id}>
                        <TableCell className="font-mono text-xs text-gray-500">{e.student.studentId}</TableCell>
                        <TableCell className="font-medium">{e.student.name}</TableCell>
                        <TableCell className="capitalize text-sm">{e.student.gender.toLowerCase()}</TableCell>
                        <TableCell className="text-sm">{e.student.guardianPhone ?? "—"}</TableCell>
                        <TableCell>
                          <Link href={`/students/${e.student.id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
