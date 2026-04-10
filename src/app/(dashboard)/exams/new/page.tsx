"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { examSchema, type ExamFormData } from "@/lib/validations/exam";

export default function NewExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema) as any,
    defaultValues: { totalMarks: 100, passMark: 33 },
  });

  useEffect(() => {
    fetch("/api/batches?active=true").then(r => r.json()).then(j => setBatches(j.data ?? []));
  }, []);

  const onSubmit = async (data: ExamFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
      toast.success("Exam created!");
      router.push(`/exams/${json.data.id}`);
    } catch { toast.error("Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Create Exam" description="Set up a new exam for a batch" />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg">
        <Card>
          <CardHeader><CardTitle>Exam Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Exam Name *</Label>
              <Input placeholder="Half-Yearly 2024" {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Batch *</Label>
              <Select onValueChange={(v: string | null) => setValue("batchId", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.batchId && <p className="text-sm text-red-500">{errors.batchId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="Mathematics" {...register("subject")} />
            </div>
            <div className="space-y-2">
              <Label>Exam Date</Label>
              <Input type="date" {...register("examDate")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input type="number" {...register("totalMarks")} />
              </div>
              <div className="space-y-2">
                <Label>Pass Mark</Label>
                <Input type="number" {...register("passMark")} />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create & Enter Marks
          </Button>
        </div>
      </form>
    </div>
  );
}
