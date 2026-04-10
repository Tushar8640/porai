import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Calendar, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ExamsPage() {
  const session = await auth();
  const organizationId = session?.user?.organizationId!;

  const exams = await prisma.exam.findMany({
    where: { organizationId },
    include: {
      batch: { select: { id: true, name: true } },
      _count: { select: { results: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Exams & Results" description="Manage exams and publish results">
        <Link href="/exams/new">
          <Button><Plus className="mr-2 h-4 w-4" />New Exam</Button>
        </Link>
      </PageHeader>

      {exams.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No exams yet. Create your first exam.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(e => (
            <Card key={e.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{e.name}</h3>
                  {e.subject && <p className="text-xs text-gray-500 mt-0.5">{e.subject}</p>}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" />{e.batch.name}</div>
                  {e.examDate && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{formatDate(e.examDate)}</div>}
                  <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{e._count.results} results entered</div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Badge variant="secondary">Total: {e.totalMarks} | Pass: {e.passMark}</Badge>
                  <div className="flex gap-1">
                    <Link href={`/exams/${e.id}`}><Button size="sm" variant="outline" className="h-7 text-xs">Marks</Button></Link>
                    <Link href={`/exams/${e.id}/results`}><Button size="sm" className="h-7 text-xs">Results</Button></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
