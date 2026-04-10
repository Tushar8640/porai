import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id: batchId } = await params;
    const { studentId } = await req.json();

    const batch = await prisma.batch.findFirst({ where: { id: batchId, organizationId } });
    if (!batch) return apiError("Batch not found", 404);

    const student = await prisma.student.findFirst({ where: { id: studentId, organizationId } });
    if (!student) return apiError("Student not found", 404);

    await prisma.enrollment.upsert({
      where: { studentId_batchId: { studentId, batchId } },
      update: { isActive: true },
      create: { studentId, batchId },
    });

    return apiSuccess({ message: "Student enrolled" });
  } catch {
    return apiError("Failed to enroll student", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id: batchId } = await params;
    const { studentId } = await req.json();

    const batch = await prisma.batch.findFirst({ where: { id: batchId, organizationId } });
    if (!batch) return apiError("Batch not found", 404);

    await prisma.enrollment.updateMany({
      where: { studentId, batchId },
      data: { isActive: false },
    });

    return apiSuccess({ message: "Student removed from batch" });
  } catch {
    return apiError("Failed to remove student", 500);
  }
}
