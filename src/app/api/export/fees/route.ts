import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM

    const where: Record<string, unknown> = { organizationId };
    if (month) {
      where.feeMonth = month;
    }

    const fees = await prisma.feeRecord.findMany({
      where,
      include: {
        student: { select: { name: true, studentId: true } },
        batch: { select: { name: true } },
      },
      orderBy: [{ feeMonth: "desc" }, { student: { name: "asc" } }],
    });

    const rows = [
      ["Invoice", "Student ID", "Student Name", "Batch", "Month", "Amount (৳)", "Paid (৳)", "Discount (৳)", "Status", "Payment Method", "Transaction Ref", "Paid Date"],
      ...fees.map(f => [
        f.invoiceNumber,
        f.student.studentId,
        f.student.name,
        f.batch?.name ?? "",
        f.feeMonth,
        f.amount.toString(),
        f.paid.toString(),
        f.discount.toString(),
        f.status,
        f.paymentMethod ?? "",
        f.transactionRef ?? "",
        f.paidAt ? new Date(f.paidAt).toLocaleDateString("en-GB") : "",
      ]),
    ];

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fees-${month ?? "all"}.csv"`,
      },
    });
  } catch {
    return apiError("Failed to export", 500);
  }
}
