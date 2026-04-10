"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import type { AttendanceStatus } from "@/generated/prisma";

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  studentCode: string;
  status: AttendanceStatus | null;
  note: string | null;
}

interface AttendanceGridProps {
  records: AttendanceRecord[];
  batchId: string;
  date: string;
  onSaved?: () => void;
}

const STATUS_OPTS = [
  { value: "PRESENT" as const, label: "P", color: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200" },
  { value: "LATE" as const, label: "L", color: "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200" },
  { value: "ABSENT" as const, label: "A", color: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200" },
];

export function AttendanceGrid({ records: initial, batchId, date, onSaved }: AttendanceGridProps) {
  const [records, setRecords] = useState(initial);
  const [saving, setSaving] = useState(false);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  };

  const markAll = (status: AttendanceStatus) => {
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const handleSave = async () => {
    const unmarked = records.filter(r => !r.status);
    if (unmarked.length > 0) {
      toast.error(`${unmarked.length} student(s) not marked`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, date, records: records.map(r => ({ studentId: r.studentId, status: r.status })) }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
      toast.success("Attendance saved!");
      onSaved?.();
    } catch { toast.error("Something went wrong."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => markAll("PRESENT")}>Mark All Present</Button>
          <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => markAll("ABSENT")}>Mark All Absent</Button>
        </div>
        <span className="text-sm text-gray-500">{records.filter(r => r.status).length} / {records.length} marked</span>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        {records.map((r, i) => (
          <div key={r.studentId} className={`flex items-center justify-between px-4 py-3 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <div className="flex items-center gap-3">
              {r.status ? (
                <CheckCircle className={`h-4 w-4 ${r.status === "PRESENT" ? "text-green-500" : r.status === "LATE" ? "text-yellow-500" : "text-red-500"}`} />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
              <div>
                <p className="text-sm font-medium">{r.studentName}</p>
                <p className="text-xs text-gray-400">{r.studentCode}</p>
              </div>
            </div>
            <div className="flex gap-1">
              {STATUS_OPTS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(r.studentId, opt.value)}
                  className={`w-9 h-9 rounded-lg border text-sm font-semibold transition-all ${r.status === opt.value ? opt.color + " ring-2 ring-offset-1" : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Attendance
      </Button>
    </div>
  );
}
