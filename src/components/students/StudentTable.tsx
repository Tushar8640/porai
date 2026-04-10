"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  studentId: string;
  name: string;
  gender: string;
  guardianPhone: string | null;
  isActive: boolean;
  joinDate: Date | string;
  enrollments: { batch: { id: string; name: string } }[];
}

interface StudentTableProps {
  students: Student[];
  onDelete?: () => void;
}

export function StudentTable({ students, onDelete }: StudentTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Student deactivated");
        setDeleteId(null);
        onDelete?.();
        router.refresh();
      } else {
        toast.error("Failed to deactivate student");
      }
    } catch { toast.error("Something went wrong."); }
    finally { setDeleting(false); }
  };

  if (students.length === 0) {
    return <p className="text-center text-gray-400 py-12">No students found.</p>;
  }

  return (
    <>
      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Guardian Phone</TableHead>
              <TableHead>Batch(es)</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-xs text-gray-500">{s.studentId}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="capitalize text-sm text-gray-600">{s.gender.toLowerCase()}</TableCell>
                <TableCell className="text-sm text-gray-600">{s.guardianPhone ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {s.enrollments.map((e) => (
                      <Badge key={e.batch.id} variant="secondary" className="text-xs">{e.batch.name}</Badge>
                    ))}
                    {s.enrollments.length === 0 && <span className="text-xs text-gray-400">None</span>}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{formatDate(s.joinDate)}</TableCell>
                <TableCell>
                  <Badge variant={s.isActive ? "default" : "secondary"} className={s.isActive ? "bg-green-100 text-green-700" : ""}>
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 focus:outline-none">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/students/${s.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/students/${s.id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate Student"
        description="This student will be marked inactive. All their records will be preserved."
        confirmLabel="Deactivate"
      />
    </>
  );
}
