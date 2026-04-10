"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Plus, Trash2, UserCog } from "lucide-react";

interface Teacher { id: string; name: string; phone: string | null; email: string | null; subject: string | null; _count: { batches: number } }

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset } = useForm<{ name: string; phone: string; email: string; subject: string }>();

  const fetch_ = async () => {
    setLoading(true);
    const r = await fetch("/api/teachers").then(r => r.json());
    setTeachers(r.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const onAdd = async (data: { name: string; phone: string; email: string; subject: string }) => {
    setSaving(true);
    const res = await fetch("/api/teachers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setSaving(false);
    if (res.ok) { toast.success("Teacher added!"); reset(); setShowAdd(false); fetch_(); }
    else toast.error("Failed");
  };

  const onDelete = async () => {
    if (!delId) return;
    setDeleting(true);
    await fetch(`/api/teachers/${delId}`, { method: "DELETE" });
    setDeleting(false);
    setDelId(null);
    toast.success("Teacher removed");
    fetch_();
  };

  return (
    <div>
      <PageHeader title="Teachers" description="Manage teaching staff">
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>
      </PageHeader>

      {loading ? <LoadingSpinner /> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Name</TableHead><TableHead>Subject</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Batches</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{t.subject ?? "—"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{t.phone ?? "—"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{t.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{t._count.batches} batch(es)</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => setDelId(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {teachers.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-10">No teachers yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Teacher</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
            <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="Md. Rahim Uddin" {...register("name", { required: true })} /></div>
            <div className="space-y-2"><Label>Subject</Label><Input placeholder="Mathematics" {...register("subject")} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input placeholder="01XXXXXXXXX" {...register("phone")} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="teacher@example.com" {...register("email")} /></div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Adding..." : "Add Teacher"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={onDelete} loading={deleting}
        title="Remove Teacher" description="This teacher will be removed from the system." confirmLabel="Remove" />
    </div>
  );
}
