import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";
import { calculateGrade } from "@/lib/utils";
import { z } from "zod";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id: examId } = await params;

    const exam = await prisma.exam.findFirst({ where: { id: examId, organizationId } });
    if (!exam) return apiError("Exam not found", 404);

    const enrollments = await prisma.enrollment.findMany({
      where: { batchId: exam.batchId, isActive: true },
      include: { student: { select: { id: true, name: true, studentId: true } } },
      orderBy: { student: { name: "asc" } },
    });

    const results = await prisma.examResult.findMany({ where: { examId } });
    const resultMap = new Map(results.map(r => [r.studentId, r]));

    const rows = enrollments.map(e => ({
      studentId: e.student.id,
      studentName: e.student.name,
      studentCode: e.student.studentId,
      marksObtained: resultMap.get(e.student.id)?.marksObtained ?? null,
      grade: resultMap.get(e.student.id)?.grade ?? null,
      isAbsent: resultMap.get(e.student.id)?.isAbsent ?? false,
      remarks: resultMap.get(e.student.id)?.remarks ?? null,
    }));

    return apiSuccess({ rows, exam });
  } catch {
    return apiError("Failed to fetch marks", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id: examId } = await params;

    const exam = await prisma.exam.findFirst({ where: { id: examId, organizationId } });
    if (!exam) return apiError("Exam not found", 404);

    const body = await req.json();
    const schema = z.object({
      results: z.array(z.object({
        studentId: z.string(),
        marksObtained: z.coerce.number().min(0),
        isAbsent: z.boolean().default(false),
        remarks: z.string().optional(),
      })),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422);

    await Promise.all(
      parsed.data.results.map(r => {
        const { grade } = r.isAbsent ? { grade: "—" } : calculateGrade(r.marksObtained, exam.totalMarks);
        return prisma.examResult.upsert({
          where: { examId_studentId: { examId, studentId: r.studentId } },
          update: { marksObtained: r.isAbsent ? 0 : r.marksObtained, grade, isAbsent: r.isAbsent, remarks: r.remarks ?? null },
          create: { examId, studentId: r.studentId, marksObtained: r.isAbsent ? 0 : r.marksObtained, grade, isAbsent: r.isAbsent, remarks: r.remarks ?? null },
        });
      })
    );

    return apiSuccess({ message: "Marks saved" });
  } catch {
    return apiError("Failed to save marks", 500);
  }
}
