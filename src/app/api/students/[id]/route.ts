import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";
import { studentSchema } from "@/lib/validations/student";

async function getStudentOrThrow(id: string, organizationId: string) {
  const student = await prisma.student.findFirst({ where: { id, organizationId } });
  if (!student) throw new Error("Not found");
  return student;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    const student = await prisma.student.findFirst({
      where: { id, organizationId },
      include: {
        enrollments: {
          where: { isActive: true },
          include: { batch: { select: { id: true, name: true, subject: true, monthlyFee: true } } },
        },
      },
    });
    if (!student) return apiError("Student not found", 404);
    return apiSuccess(student);
  } catch {
    return apiError("Failed to fetch student", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    await getStudentOrThrow(id, organizationId);

    const body = await req.json();
    const parsed = studentSchema.partial().safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const { batchIds, dateOfBirth, phone, guardianPhone, ...rest } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.student.update({
        where: { id },
        data: {
          ...rest,
          phone: phone || null,
          guardianPhone: guardianPhone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        },
      });

      if (batchIds !== undefined) {
        // Deactivate current enrollments
        await tx.enrollment.updateMany({ where: { studentId: id }, data: { isActive: false } });
        // Re-enroll in selected batches
        if (batchIds.length > 0) {
          await tx.enrollment.createMany({
            data: batchIds.map((batchId) => ({ studentId: id, batchId, isActive: true })),
            skipDuplicates: true,
          });
          await tx.enrollment.updateMany({
            where: { studentId: id, batchId: { in: batchIds } },
            data: { isActive: true },
          });
        }
      }

      return s;
    });

    return apiSuccess(updated);
  } catch {
    return apiError("Failed to update student", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    await getStudentOrThrow(id, organizationId);

    await prisma.student.update({ where: { id }, data: { isActive: false } });
    return apiSuccess({ message: "Student deactivated" });
  } catch {
    return apiError("Failed to delete student", 500);
  }
}
