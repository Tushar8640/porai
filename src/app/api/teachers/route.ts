import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";
import { z } from "zod";

const teacherSchema = z.object({
  name: z.string().min(2, "Name required").max(100),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  subject: z.string().max(100).optional().or(z.literal("")),
});

export async function GET(_: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const teachers = await prisma.teacher.findMany({
      where: { organizationId, isActive: true },
      include: { _count: { select: { batches: { where: { isActive: true } } } } },
      orderBy: { name: "asc" },
    });
    return apiSuccess(teachers);
  } catch {
    return apiError("Failed to fetch teachers", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const body = await req.json();
    const parsed = teacherSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const { name, phone, email, subject } = parsed.data;
    const teacher = await prisma.teacher.create({
      data: { organizationId, name, phone: phone || null, email: email || null, subject: subject || null },
    });
    return apiSuccess(teacher, 201);
  } catch {
    return apiError("Failed to create teacher", 500);
  }
}
