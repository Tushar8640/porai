import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { StudentForm } from "@/components/students/StudentForm";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!organizationId) notFound();

  const student = await prisma.student.findFirst({
    where: { id, organizationId },
    include: {
      enrollments: { where: { isActive: true }, select: { batchId: true } },
    },
  });

  if (!student) notFound();

  return (
    <div>
      <PageHeader title="Edit Student" description={`Editing: ${student.name}`} />
      <StudentForm
        isEdit
        defaultValues={{
          id: student.id,
          name: student.name,
          nameBn: student.nameBn ?? "",
          gender: student.gender,
          dateOfBirth: student.dateOfBirth?.toISOString().split("T")[0] ?? "",
          phone: student.phone ?? "",
          guardianName: student.guardianName ?? "",
          guardianPhone: student.guardianPhone ?? "",
          address: student.address ?? "",
          batchIds: student.enrollments.map(e => e.batchId),
        }}
      />
    </div>
  );
}
