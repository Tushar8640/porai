import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";
import { examSchema } from "@/lib/validations/exam";

export async function GET(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    const exams = await prisma.exam.findMany({
      where: { organizationId, ...(batchId && { batchId }) },
      include: {
        batch: { select: { id: true, name: true } },
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(exams);
  } catch {
    return apiError("Failed to fetch exams", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const body = await req.json();
    const parsed = examSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const { name, batchId, subject, examDate, totalMarks, passMark } = parsed.data;

    const exam = await prisma.exam.create({
      data: {
        organizationId,
        name,
        batchId,
        subject: subject || null,
        examDate: examDate ? new Date(examDate) : null,
        totalMarks,
        passMark,
      },
    });

    return apiSuccess(exam, 201);
  } catch {
    return apiError("Failed to create exam", 500);
  }
}
