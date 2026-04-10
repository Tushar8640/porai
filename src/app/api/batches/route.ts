import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";
import { z } from "zod";

const batchSchema = z.object({
  name: z.string().min(2, "Batch name required").max(100),
  subject: z.string().max(200).optional().or(z.literal("")),
  schedule: z.string().max(200).optional().or(z.literal("")),
  teacherId: z.string().optional().or(z.literal("")),
  monthlyFee: z.coerce.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");

    const batches = await prisma.batch.findMany({
      where: {
        organizationId,
        ...(active !== null && { isActive: active === "true" }),
      },
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { enrollments: { where: { isActive: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(batches);
  } catch {
    return apiError("Failed to fetch batches", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const body = await req.json();
    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422);

    const { name, subject, schedule, teacherId, monthlyFee } = parsed.data;

    const batch = await prisma.batch.create({
      data: {
        organizationId,
        name,
        subject: subject || null,
        schedule: schedule || null,
        teacherId: teacherId || null,
        monthlyFee,
      },
    });

    return apiSuccess(batch, 201);
  } catch {
    return apiError("Failed to create batch", 500);
  }
}
