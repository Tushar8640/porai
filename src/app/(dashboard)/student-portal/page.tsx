import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTaka, getCurrentMonth } from "@/lib/utils";
import { User } from "lucide-react";

export default async function StudentPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Student portal: find student record linked to this user email
  const userStudent = await prisma.student.findFirst({
    where: { organizationId: session.user.organizationId!, isActive: true },
    include: {
      enrollments: { where: { isActive: true }, include: { batch: { select: { name: true } } } },
      attendances: { where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, orderBy: { date: "desc" } },
      feeRecords: { orderBy: { createdAt: "desc" }, take: 10 },
      examResults: { include: { exam: { select: { name: true, totalMarks: true, subject: true } } }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
          <User className="h-8 w-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{userStudent?.name ?? session.user.name}</h1>
          <p className="text-sm text-gray-500">Student Portal</p>
          {userStudent && <p className="text-xs text-gray-400">ID: {userStudent.studentId}</p>}
        </div>
      </div>

      {!userStudent ? (
        <Card><CardContent className="pt-6 text-center text-gray-400">No student profile linked to your account. Contact your coaching center admin.</CardContent></Card>
      ) : (
        <Tabs defaultValue="attendance">
          <TabsList><TabsTrigger value="attendance">Attendance</TabsTrigger><TabsTrigger value="results">Results</TabsTrigger><TabsTrigger value="fees">Fees</TabsTrigger></TabsList>

          <TabsContent value="attendance" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">This Month's Attendance</CardTitle></CardHeader>
              <CardContent>
                {userStudent.attendances.length === 0 ? <p className="text-sm text-gray-400">No records this month.</p> : (
                  <div className="space-y-2">
                    {userStudent.attendances.map(a => (
                      <div key={a.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{formatDate(a.date)}</span>
                        <Badge className={a.status === "PRESENT" ? "bg-green-100 text-green-700" : a.status === "LATE" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>{a.status}</Badge>
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
                {userStudent.examResults.length === 0 ? <p className="text-sm text-gray-400">No results yet.</p> : (
                  <div className="space-y-3">
                    {userStudent.examResults.map(r => (
                      <div key={r.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-sm">{r.exam.name}</p>
                          <p className="text-xs text-gray-400">{r.exam.subject}</p>
                        </div>
                        <div className="text-right">
                          {r.isAbsent ? <Badge variant="secondary">Absent</Badge> : (
                            <>
                              <p className="font-bold">{r.marksObtained.toString()} / {r.exam.totalMarks}</p>
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

          <TabsContent value="fees" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Fee History</CardTitle></CardHeader>
              <CardContent>
                {userStudent.feeRecords.length === 0 ? <p className="text-sm text-gray-400">No fee records.</p> : (
                  <div className="space-y-3">
                    {userStudent.feeRecords.map(f => (
                      <div key={f.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-sm">{f.feeMonth}</p>
                          <p className="text-xs text-gray-400">{f.invoiceNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatTaka(f.amount.toString())}</p>
                          <Badge className={f.status === "PAID" ? "bg-green-100 text-green-700" : f.status === "PARTIAL" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>{f.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
