"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { getCurrentMonth } from "@/lib/utils";

interface Batch { id: string; name: string }
interface SummaryRow {
  studentId: string; studentCode: string; studentName: string;
  present: number; late: number; absent: number; total: number; percentage: number;
}

export default function AttendanceReportsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [month, setMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/batches?active=true").then(r => r.json()).then(j => setBatches(j.data ?? []));
  }, []);

  const loadReport = async () => {
    if (!batchId) return;
    setLoading(true);
    const res = await fetch(`/api/attendance/reports?batchId=${batchId}&month=${month}`);
    const json = await res.json();
    setSummary(json.data?.summary ?? []);
    setLoading(false);
    setLoaded(true);
  };

  return (
    <div>
      <PageHeader title="Attendance Reports" description="Monthly attendance summary per batch" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-48">
              <Label>Batch</Label>
              <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <Button onClick={loadReport} disabled={!batchId || loading}>Generate Report</Button>
          </div>
        </CardContent>
      </Card>

      {loading && <LoadingSpinner />}

      {loaded && summary.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Report for {month}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center text-green-700">Present</TableHead>
                  <TableHead className="text-center text-yellow-700">Late</TableHead>
                  <TableHead className="text-center text-red-700">Absent</TableHead>
                  <TableHead className="text-center">Total Days</TableHead>
                  <TableHead className="text-center">Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map(row => (
                  <TableRow key={row.studentId} className={row.percentage < 75 ? "bg-red-50" : ""}>
                    <TableCell>
                      <p className="font-medium text-sm">{row.studentName}</p>
                      <p className="text-xs text-gray-400">{row.studentCode}</p>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-green-700">{row.present}</TableCell>
                    <TableCell className="text-center font-semibold text-yellow-700">{row.late}</TableCell>
                    <TableCell className="text-center font-semibold text-red-700">{row.absent}</TableCell>
                    <TableCell className="text-center text-gray-600">{row.total}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={row.percentage >= 75 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {row.percentage}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {loaded && summary.length === 0 && (
        <p className="text-center text-gray-400 py-12">No attendance data for this period.</p>
      )}
    </div>
  );
}
