import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";

export async function GET(_: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalStudents, activeBatches, todayAttendance, monthlyDues, newStudents] = await Promise.all([
      prisma.student.count({ where: { organizationId, isActive: true } }),
      prisma.batch.count({ where: { organizationId, isActive: true } }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { organizationId, date: today },
        _count: true,
      }),
      prisma.feeRecord.aggregate({
        where: { organizationId, status: { in: ["DUE", "PARTIAL"] } },
        _sum: { amount: true, paid: true, discount: true },
      }),
      prisma.student.count({ where: { organizationId, isActive: true, createdAt: { gte: monthStart } } }),
    ]);

    const presentCount = todayAttendance.find(a => a.status === "PRESENT")?._count ?? 0;
    const lateCount = todayAttendance.find(a => a.status === "LATE")?._count ?? 0;
    const absentCount = todayAttendance.find(a => a.status === "ABSENT")?._count ?? 0;
    const totalMarked = presentCount + lateCount + absentCount;
    const attendanceRate = totalMarked > 0 ? Math.round(((presentCount + lateCount) / totalMarked) * 100) : 0;

    const totalDues = Number(monthlyDues._sum.amount ?? 0) - Number(monthlyDues._sum.discount ?? 0) - Number(monthlyDues._sum.paid ?? 0);

    return apiSuccess({
      totalStudents,
      activeBatches,
      todayAttendanceRate: attendanceRate,
      totalMarkedToday: totalMarked,
      totalMonthlyDues: totalDues,
      newStudentsThisMonth: newStudents,
    });
  } catch {
    return apiError("Failed to fetch stats", 500);
  }
}
