import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const month = searchParams.get("month"); // YYYY-MM

    if (!batchId || !month) return apiError("batchId and month are required", 400);

    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);

    const [batch, records] = await Promise.all([
      prisma.batch.findFirst({ where: { id: batchId, organizationId } }),
      prisma.attendance.findMany({
        where: { organizationId, batchId, date: { gte: start, lte: end } },
        include: { student: { select: { name: true, studentId: true } } },
        orderBy: [{ date: "asc" }, { student: { name: "asc" } }],
      }),
    ]);

    if (!batch) return apiError("Batch not found", 404);

    const rows = [
      ["Date", "Student ID", "Student Name", "Status", "Note"],
      ...records.map(r => [
        new Date(r.date).toLocaleDateString("en-GB"),
        r.student.studentId,
        r.student.name,
        r.status,
        r.note ?? "",
      ]),
    ];

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-${batch.name}-${month}.csv"`,
      },
    });
  } catch {
    return apiError("Failed to export", 500);
  }
}
