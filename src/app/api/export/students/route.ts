import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError } from "@/lib/tenant";

export async function GET(_: NextRequest) {
  try {
    const organizationId = await getSessionOrg();

    const students = await prisma.student.findMany({
      where: { organizationId },
      include: {
        enrollments: { include: { batch: { select: { name: true } } } },
      },
      orderBy: { name: "asc" },
    });

    const rows = [
      ["Student ID", "Name", "Bangla Name", "Gender", "Date of Birth", "Phone", "Guardian Name", "Guardian Phone", "Address", "Batches", "Join Date", "Status"],
      ...students.map(s => [
        s.studentId,
        s.name,
        s.nameBn ?? "",
        s.gender,
        s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString("en-GB") : "",
        s.phone ?? "",
        s.guardianName ?? "",
        s.guardianPhone ?? "",
        s.address ?? "",
        s.enrollments.map(e => e.batch.name).join("; "),
        new Date(s.joinDate).toLocaleDateString("en-GB"),
        s.isActive ? "Active" : "Inactive",
      ]),
    ];

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="students-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch {
    return apiError("Failed to export", 500);
  }
}
