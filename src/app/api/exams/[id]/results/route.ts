import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id: examId } = await params;

    const exam = await prisma.exam.findFirst({
      where: { id: examId, organizationId },
      include: { batch: { select: { name: true } } },
    });
    if (!exam) return apiError("Exam not found", 404);

    const results = await prisma.examResult.findMany({
      where: { examId },
      include: { student: { select: { id: true, name: true, studentId: true } } },
      orderBy: { marksObtained: "desc" },
    });

    const ranked = results.map((r, i) => ({
      rank: r.isAbsent ? "—" : i + 1,
      studentId: r.student.id,
      studentCode: r.student.studentId,
      studentName: r.student.name,
      marksObtained: r.isAbsent ? 0 : Number(r.marksObtained),
      grade: r.grade,
      isAbsent: r.isAbsent,
      remarks: r.remarks,
      pass: !r.isAbsent && Number(r.marksObtained) >= exam.passMark,
    }));

    return apiSuccess({ results: ranked, exam });
  } catch {
    return apiError("Failed to fetch results", 500);
  }
}
