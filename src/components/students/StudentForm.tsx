"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { studentSchema, type StudentFormData } from "@/lib/validations/student";

interface Batch { id: string; name: string; monthlyFee: number }
interface StudentFormProps {
  defaultValues?: Partial<StudentFormData> & { id?: string };
  isEdit?: boolean;
}

export function StudentForm({ defaultValues, isEdit }: StudentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>(defaultValues?.batchIds ?? []);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      gender: "MALE",
      batchIds: [],
      ...defaultValues,
    },
  });

  useEffect(() => {
    fetch("/api/batches?active=true")
      .then((r) => r.json())
      .then((j) => setBatches(j.data ?? []));
  }, []);

  const toggleBatch = (id: string) => {
    setSelectedBatches((prev) => {
      const next = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
      setValue("batchIds", next);
      return next;
    });
  };

  const onSubmit = async (data: StudentFormData) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/students/${defaultValues?.id}` : "/api/students";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
      toast.success(isEdit ? "Student updated!" : "Student added!");
      router.push("/students");
      router.refresh();
    } catch { toast.error("Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label>Full Name (English) *</Label>
            <Input placeholder="Mohammad Rakib" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Name (Bengali)</Label>
            <Input placeholder="মোহাম্মদ রাকিব" {...register("nameBn")} />
          </div>
          <div className="space-y-2">
            <Label>Gender *</Label>
            <Select onValueChange={(v) => setValue("gender", v as "MALE"|"FEMALE"|"OTHER")} defaultValue={defaultValues?.gender ?? "MALE"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input type="date" {...register("dateOfBirth")} />
          </div>
          <div className="space-y-2">
            <Label>Student Phone</Label>
            <Input placeholder="01XXXXXXXXX" {...register("phone")} />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Guardian Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Guardian Name</Label>
            <Input placeholder="Father / Mother name" {...register("guardianName")} />
          </div>
          <div className="space-y-2">
            <Label>Guardian Phone</Label>
            <Input placeholder="01XXXXXXXXX" {...register("guardianPhone")} />
            {errors.guardianPhone && <p className="text-sm text-red-500">{errors.guardianPhone.message}</p>}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Address</Label>
            <Input placeholder="Village/Area, District" {...register("address")} />
          </div>
        </CardContent>
      </Card>

      {batches.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Enroll in Batches</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {batches.map((b) => (
                <label key={b.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedBatches.includes(b.id) ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="checkbox" className="rounded" checked={selectedBatches.includes(b.id)} onChange={() => toggleBatch(b.id)} />
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-gray-500">৳{b.monthlyFee}/month</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Update Student" : "Add Student"}
        </Button>
      </div>
    </form>
  );
}
