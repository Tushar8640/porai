import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, getSession, apiError, apiSuccess } from "@/lib/tenant";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const batchId = searchParams.get("batchId");

    const records = await prisma.feeRecord.findMany({
      where: {
        organizationId,
        ...(status && { status: status as "PAID" | "PARTIAL" | "DUE" | "WAIVED" }),
        ...(month && { feeMonth: month }),
        ...(batchId && { batchId }),
      },
      include: {
        student: { select: { id: true, name: true, studentId: true } },
        batch: { select: { id: true, name: true } },
      },
      orderBy: [{ feeMonth: "desc" }, { createdAt: "desc" }],
    });

    return apiSuccess(records);
  } catch {
    return apiError("Failed to fetch fees", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const organizationId = session.user.organizationId!;
    const body = await req.json();

    const { batchId, feeMonth, amount, dueDate } = body;
    if (!batchId || !feeMonth || !amount) return apiError("batchId, feeMonth, and amount are required", 400);

    // Get org for slug
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { slug: true },
    });

    // Get all active enrollments in the batch
    const enrollments = await prisma.enrollment.findMany({
      where: { batchId, isActive: true },
      include: { student: { select: { id: true } } },
    });

    if (enrollments.length === 0) return apiError("No students enrolled in this batch", 400);

    // Get existing fee records for this batch+month to avoid duplicates
    const existing = await prisma.feeRecord.findMany({
      where: { batchId, feeMonth, organizationId },
      select: { studentId: true },
    });
    const existingStudentIds = new Set(existing.map(e => e.studentId));

    // Get latest invoice sequence
    const lastInvoice = await prisma.feeRecord.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    let seq = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split("-");
      seq = parseInt(parts[parts.length - 1]) + 1;
    }

    const newEnrollments = enrollments.filter(e => !existingStudentIds.has(e.student.id));

    const records = await prisma.$transaction(
      newEnrollments.map((e, i) =>
        prisma.feeRecord.create({
          data: {
            organizationId,
            studentId: e.student.id,
            batchId,
            feeMonth,
            amount,
            dueDate: new Date(dueDate),
            invoiceNumber: generateInvoiceNumber(org!.slug, seq + i),
          },
        })
      )
    );

    return apiSuccess({ created: records.length, skipped: existing.length }, 201);
  } catch (err) {
    console.error(err);
    return apiError("Failed to generate fee records", 500);
  }
}
