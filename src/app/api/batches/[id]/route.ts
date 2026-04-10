import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";
import { z } from "zod";

const batchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  subject: z.string().max(200).optional().or(z.literal("")),
  schedule: z.string().max(200).optional().or(z.literal("")),
  teacherId: z.string().optional().or(z.literal("")),
  monthlyFee: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    const batch = await prisma.batch.findFirst({
      where: { id, organizationId },
      include: {
        teacher: { select: { id: true, name: true } },
        enrollments: {
          where: { isActive: true },
          include: { student: { select: { id: true, studentId: true, name: true, gender: true, phone: true } } },
        },
      },
    });
    if (!batch) return apiError("Batch not found", 404);
    return apiSuccess(batch);
  } catch {
    return apiError("Failed to fetch batch", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    const existing = await prisma.batch.findFirst({ where: { id, organizationId } });
    if (!existing) return apiError("Batch not found", 404);

    const body = await req.json();
    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const { teacherId, subject, schedule, ...rest } = parsed.data;
    const batch = await prisma.batch.update({
      where: { id },
      data: {
        ...rest,
        subject: subject || null,
        schedule: schedule || null,
        teacherId: teacherId || null,
      },
    });

    return apiSuccess(batch);
  } catch {
    return apiError("Failed to update batch", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    const existing = await prisma.batch.findFirst({ where: { id, organizationId } });
    if (!existing) return apiError("Batch not found", 404);

    await prisma.batch.update({ where: { id }, data: { isActive: false } });
    return apiSuccess({ message: "Batch deactivated" });
  } catch {
    return apiError("Failed to delete batch", 500);
  }
}
