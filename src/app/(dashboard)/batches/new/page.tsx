"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Batch name required"),
  subject: z.string().optional().or(z.literal("")),
  schedule: z.string().optional().or(z.literal("")),
  teacherId: z.string().optional().or(z.literal("")),
  monthlyFee: z.coerce.number().min(0).default(0),
});
type FormData = z.infer<typeof schema>;

export default function NewBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetch("/api/teachers").then(r => r.json()).then(j => setTeachers(j.data ?? []));
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
      toast.success("Batch created!");
      router.push("/batches");
    } catch { toast.error("Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="New Batch" description="Create a new class batch" />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg">
        <Card>
          <CardHeader><CardTitle>Batch Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Batch Name *</Label>
              <Input placeholder="Class 10 - Science (Morning)" {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Subjects</Label>
              <Input placeholder="Mathematics, Physics, Chemistry" {...register("subject")} />
            </div>
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Input placeholder="Sat, Mon, Wed — 8:00 AM" {...register("schedule")} />
            </div>
            <div className="space-y-2">
              <Label>Monthly Fee (৳)</Label>
              <Input type="number" placeholder="800" {...register("monthlyFee")} />
            </div>
            {teachers.length > 0 && (
              <div className="space-y-2">
                <Label>Assign Teacher</Label>
                <Select onValueChange={(v) => setValue("teacherId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select teacher (optional)" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Batch
          </Button>
        </div>
      </form>
    </div>
  );
}
