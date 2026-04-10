import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const month = searchParams.get("month"); // YYYY-MM

    if (!batchId || !month) return apiError("batchId and month are required", 400);

    const [year, mon] = month.split("-").map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0); // last day of month

    const enrollments = await prisma.enrollment.findMany({
      where: { batchId, isActive: true },
      include: { student: { select: { id: true, name: true, studentId: true } } },
      orderBy: { student: { name: "asc" } },
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        organizationId,
        batchId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const summary = enrollments.map(e => {
      const records = attendances.filter(a => a.studentId === e.student.id);
      const present = records.filter(a => a.status === "PRESENT").length;
      const late = records.filter(a => a.status === "LATE").length;
      const absent = records.filter(a => a.status === "ABSENT").length;
      const total = records.length;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      return {
        studentId: e.student.id,
        studentCode: e.student.studentId,
        studentName: e.student.name,
        present,
        late,
        absent,
        total,
        percentage,
      };
    });

    return apiSuccess({ summary, month, batchId });
  } catch {
    return apiError("Failed to fetch attendance report", 500);
  }
}
