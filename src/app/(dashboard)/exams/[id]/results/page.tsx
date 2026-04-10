"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Printer, Pencil } from "lucide-react";

interface ResultRow {
  rank: number | string; studentId: string; studentCode: string; studentName: string;
  marksObtained: number; grade: string | null; isAbsent: boolean; pass: boolean; remarks: string | null;
}

interface Exam {
  id: string; name: string; totalMarks: number; passMark: number; subject: string | null;
  batch: { name: string };
}

export default function ResultsPage() {
  const { id: examId } = useParams<{ id: string }>();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/exams/${examId}/results`)
      .then(r => r.json())
      .then(j => { setResults(j.data?.results ?? []); setExam(j.data?.exam); setLoading(false); });
  }, [examId]);

  if (loading) return <LoadingSpinner />;

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass && !r.isAbsent).length;
  const absent = results.filter(r => r.isAbsent).length;
  const avg = results.filter(r => !r.isAbsent).reduce((s, r) => s + r.marksObtained, 0) / (results.length - absent || 1);

  return (
    <div>
      <PageHeader title={`Results: ${exam?.name}`} description={`${exam?.batch.name} | ${exam?.subject ?? ""}`}>
        <Link href={`/exams/${examId}`}>
          <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit Marks</Button>
        </Link>
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 print:hidden">
        {[
          { label: "Total Students", value: results.length, color: "text-gray-900" },
          { label: "Passed", value: passed, color: "text-green-600" },
          { label: "Failed", value: failed, color: "text-red-600" },
          { label: "Avg. Marks", value: avg.toFixed(1), color: "text-indigo-600" },
        ].map(s => (
          <Card key={s.label}><CardContent className="pt-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card id="result-sheet">
        <CardHeader className="print:pb-4">
          <div className="hidden print:block text-center mb-2">
            <h2 className="text-xl font-bold">{exam?.name} — Result Sheet</h2>
            <p className="text-sm text-gray-500">{exam?.batch.name} | {exam?.subject}</p>
          </div>
          <CardTitle className="text-base print:hidden">Result Sheet</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Marks / {exam?.totalMarks}</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Result</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(r => (
                <TableRow key={r.studentId} className={r.isAbsent ? "opacity-60" : ""}>
                  <TableCell className="font-bold text-gray-500">{r.rank}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{r.studentName}</p>
                    <p className="text-xs text-gray-400">{r.studentCode}</p>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{r.isAbsent ? "—" : r.marksObtained}</TableCell>
                  <TableCell className="text-center">
                    {r.isAbsent ? <Badge variant="secondary">Absent</Badge> :
                      <Badge className={r.grade === "F" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}>{r.grade}</Badge>}
                  </TableCell>
                  <TableCell className="text-center">
                    {!r.isAbsent && <Badge className={r.pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{r.pass ? "PASS" : "FAIL"}</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{r.remarks ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          nav, header { display: none !important; }
          #result-sheet { border: none; }
        }
      `}</style>
    </div>
  );
}
