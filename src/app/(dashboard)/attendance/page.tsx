"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttendanceGrid } from "@/components/attendance/AttendanceGrid";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { BarChart2 } from "lucide-react";

interface Batch { id: string; name: string }

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState(searchParams.get("batchId") ?? "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<{studentId:string;studentName:string;studentCode:string;status:null;note:null}[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/batches?active=true").then(r => r.json()).then(j => setBatches(j.data ?? []));
  }, []);

  const loadAttendance = async () => {
    if (!batchId) return;
    setLoading(true);
    setLoaded(false);
    const res = await fetch(`/api/attendance?batchId=${batchId}&date=${date}`);
    const json = await res.json();
    setRecords(json.data?.records ?? []);
    setLoading(false);
    setLoaded(true);
  };

  return (
    <div>
      <PageHeader title="Attendance" description="Mark daily attendance for batches">
        <Link href="/attendance/reports">
          <Button variant="outline"><BarChart2 className="mr-2 h-4 w-4" />Reports</Button>
        </Link>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Select Batch & Date</CardTitle></CardHeader>
        <CardContent>
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
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
            </div>
            <Button onClick={loadAttendance} disabled={!batchId || loading}>Load</Button>
          </div>
        </CardContent>
      </Card>

      {loading && <LoadingSpinner />}

      {loaded && records.length === 0 && (
        <p className="text-center text-gray-400 py-12">No students enrolled in this batch.</p>
      )}

      {loaded && records.length > 0 && (
        <AttendanceGrid
          records={records}
          batchId={batchId}
          date={date}
          onSaved={loadAttendance}
        />
      )}
    </div>
  );
}
