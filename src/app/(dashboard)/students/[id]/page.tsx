import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, User, Phone, MapPin, BookOpen } from "lucide-react";
import { formatDate, formatTaka } from "@/lib/utils";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!organizationId) notFound();

  const student = await prisma.student.findFirst({
    where: { id, organizationId },
    include: {
      enrollments: {
        where: { isActive: true },
        include: { batch: { select: { id: true, name: true, subject: true, monthlyFee: true } } },
      },
      attendances: { orderBy: { date: "desc" }, take: 10 },
      feeRecords: { orderBy: { createdAt: "desc" }, take: 10 },
      examResults: {
        include: { exam: { select: { name: true, totalMarks: true, subject: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!student) notFound();

  return (
    <div>
      <PageHeader title={student.name} description={`Student ID: ${student.studentId}`}>
        <Link href={`/students/${id}/edit`}>
          <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{student.name}</p>
                {student.nameBn && <p className="text-sm text-gray-500">{student.nameBn}</p>}
                <Badge variant="secondary" className="mt-1 capitalize">{student.gender.toLowerCase()}</Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {student.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />{student.phone}
                </div>
              )}
              {student.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />{student.address}
                </div>
              )}
              {student.guardianName && (
                <div className="text-gray-600">
                  <span className="font-medium">Guardian:</span> {student.guardianName}
                  {student.guardianPhone && ` (${student.guardianPhone})`}
                </div>
              )}
              <div className="text-gray-600">
                <span className="font-medium">Joined:</span> {formatDate(student.joinDate)}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <BookOpen className="h-4 w-4" />Enrolled Batches
              </p>
              <div className="space-y-1">
                {student.enrollments.map(e => (
                  <div key={e.batch.id} className="text-sm text-gray-600 bg-gray-50 rounded px-2 py-1">
                    {e.batch.name}
                    <span className="text-xs text-gray-400 ml-1">• {formatTaka(e.batch.monthlyFee)}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="attendance">
            <TabsList>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Recent Attendance</CardTitle></CardHeader>
                <CardContent>
                  {student.attendances.length === 0 ? (
                    <p className="text-sm text-gray-400">No attendance records yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {student.attendances.map(a => (
                        <div key={a.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{formatDate(a.date)}</span>
                          <Badge variant={a.status === "PRESENT" ? "default" : a.status === "LATE" ? "secondary" : "destructive"}
                            className={a.status === "PRESENT" ? "bg-green-100 text-green-700" : a.status === "LATE" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                            {a.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Fee Records</CardTitle></CardHeader>
                <CardContent>
                  {student.feeRecords.length === 0 ? (
                    <p className="text-sm text-gray-400">No fee records yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {student.feeRecords.map(f => (
                        <div key={f.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{f.feeMonth}</p>
                            <p className="text-xs text-gray-400">{f.invoiceNumber}</p>
                          </div>
                          <div className="text-right">
                            <p>{formatTaka(f.amount.toString())}</p>
                            <Badge variant="secondary" className={
                              f.status === "PAID" ? "bg-green-100 text-green-700" :
                              f.status === "PARTIAL" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }>{f.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Exam Results</CardTitle></CardHeader>
                <CardContent>
                  {student.examResults.length === 0 ? (
                    <p className="text-sm text-gray-400">No exam results yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {student.examResults.map(r => (
                        <div key={r.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{r.exam.name}</p>
                            <p className="text-xs text-gray-400">{r.exam.subject}</p>
                          </div>
                          <div className="text-right">
                            {r.isAbsent ? (
                              <Badge variant="secondary">Absent</Badge>
                            ) : (
                              <>
                                <p className="font-semibold">{r.marksObtained.toString()} / {r.exam.totalMarks}</p>
                                <Badge className="bg-indigo-100 text-indigo-700">{r.grade}</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
