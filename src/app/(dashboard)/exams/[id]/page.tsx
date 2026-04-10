"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import { Save, BarChart2 } from "lucide-react";
import { calculateGrade } from "@/lib/utils";

interface Row {
  studentId: string; studentName: string; studentCode: string;
  marksObtained: number | null; grade: string | null; isAbsent: boolean; remarks: string | null;
}

interface Exam { id: string; name: string; totalMarks: number; passMark: number; subject: string | null }

export default function MarksEntryPage() {
  const { id: examId } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/exams/${examId}/marks`)
      .then(r => r.json())
      .then(j => {
        setExam(j.data?.exam);
        setRows((j.data?.rows ?? []).map((r: Row) => ({ ...r, marksObtained: r.marksObtained ?? "" })));
        setLoading(false);
      });
  }, [examId]);

  const updateRow = (studentId: string, field: keyof Row, value: unknown) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/exams/${examId}/marks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        results: rows.map(r => ({
          studentId: r.studentId,
          marksObtained: r.isAbsent ? 0 : Number(r.marksObtained ?? 0),
          isAbsent: r.isAbsent,
          remarks: r.remarks,
        })),
      }),
    });
    setSaving(false);
    if (res.ok) toast.success("Marks saved!");
    else toast.error("Failed to save marks");
  };

  if (loading) return <LoadingSpinner />;
  if (!exam) return <p className="text-center text-red-500 py-12">Exam not found.</p>;

  return (
    <div>
      <PageHeader title={exam.name} description={`${exam.subject ?? ""} | Total: ${exam.totalMarks} | Pass: ${exam.passMark}`}>
        <Link href={`/exams/${examId}/results`}>
          <Button variant="outline"><BarChart2 className="mr-2 h-4 w-4" />View Results</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save All"}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle className="text-base">Enter Marks ({rows.length} students)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Student</TableHead>
                <TableHead className="w-32">Marks / {exam.totalMarks}</TableHead>
                <TableHead className="w-24 text-center">Absent</TableHead>
                <TableHead className="w-24">Grade</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => {
                const marks = Number(row.marksObtained);
                const { grade } = (!row.isAbsent && marks >= 0 && row.marksObtained !== null) ? calculateGrade(marks, exam.totalMarks) : { grade: "—" };
                return (
                  <TableRow key={row.studentId}>
                    <TableCell>
                      <p className="font-medium text-sm">{row.studentName}</p>
                      <p className="text-xs text-gray-400">{row.studentCode}</p>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0} max={exam.totalMarks}
                        value={row.isAbsent ? "" : (row.marksObtained ?? "")}
                        disabled={row.isAbsent}
                        onChange={e => updateRow(row.studentId, "marksObtained", e.target.value)}
                        className="w-24 h-8 text-sm"
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input type="checkbox" checked={row.isAbsent}
                        onChange={e => updateRow(row.studentId, "isAbsent", e.target.checked)}
                        className="h-4 w-4 rounded" />
                    </TableCell>
                    <TableCell>
                      {row.isAbsent ? <Badge variant="secondary">Absent</Badge> :
                        row.marksObtained !== null ? (
                          <Badge className={grade === "F" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}>{grade}</Badge>
                        ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Input value={row.remarks ?? ""} onChange={e => updateRow(row.studentId, "remarks", e.target.value)}
                        placeholder="Optional remarks" className="h-8 text-sm" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
