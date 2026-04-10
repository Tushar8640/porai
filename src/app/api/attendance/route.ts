import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, getSession, apiError, apiSuccess } from "@/lib/tenant";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const dateStr = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    if (!batchId) return apiError("batchId is required", 400);

    const date = new Date(dateStr);

    // Get all enrolled students in the batch
    const enrollments = await prisma.enrollment.findMany({
      where: { batchId, isActive: true },
      include: { student: { select: { id: true, name: true, studentId: true } } },
      orderBy: { student: { name: "asc" } },
    });

    // Get existing attendance records
    const attendances = await prisma.attendance.findMany({
      where: { organizationId, batchId, date },
    });

    const attendanceMap = new Map(attendances.map(a => [a.studentId, a]));

    const records = enrollments.map(e => ({
      studentId: e.student.id,
      studentName: e.student.name,
      studentCode: e.student.studentId,
      status: attendanceMap.get(e.student.id)?.status ?? null,
      note: attendanceMap.get(e.student.id)?.note ?? null,
    }));

    return apiSuccess({ records, date: dateStr, batchId });
  } catch {
    return apiError("Failed to fetch attendance", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const organizationId = session.user.organizationId!;
    const body = await req.json();

    const schema = z.object({
      batchId: z.string(),
      date: z.string(),
      records: z.array(z.object({
        studentId: z.string(),
        status: z.enum(["PRESENT", "ABSENT", "LATE"]),
        note: z.string().optional(),
      })),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const { batchId, date, records } = parsed.data;
    const dateObj = new Date(date);

    await Promise.all(
      records.map(r =>
        prisma.attendance.upsert({
          where: { studentId_batchId_date: { studentId: r.studentId, batchId, date: dateObj } },
          update: { status: r.status, note: r.note ?? null, markedById: session.user.id },
          create: {
            organizationId,
            studentId: r.studentId,
            batchId,
            date: dateObj,
            status: r.status,
            note: r.note ?? null,
            markedById: session.user.id,
          },
        })
      )
    );

    return apiSuccess({ message: "Attendance saved", count: records.length });
  } catch {
    return apiError("Failed to save attendance", 500);
  }
}
