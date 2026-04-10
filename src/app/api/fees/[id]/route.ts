import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, getSession, apiError, apiSuccess } from "@/lib/tenant";
import { collectPaymentSchema } from "@/lib/validations/fee";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    const record = await prisma.feeRecord.findFirst({
      where: { id, organizationId },
      include: {
        student: { select: { id: true, name: true, studentId: true, phone: true, guardianPhone: true } },
        batch: { select: { id: true, name: true } },
      },
    });
    if (!record) return apiError("Fee record not found", 404);
    return apiSuccess(record);
  } catch {
    return apiError("Failed to fetch fee record", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const organizationId = session.user.organizationId!;
    const { id } = await params;

    const record = await prisma.feeRecord.findFirst({ where: { id, organizationId } });
    if (!record) return apiError("Fee record not found", 404);

    const body = await req.json();
    const parsed = collectPaymentSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const { paid, paymentMethod, transactionRef, notes } = parsed.data;

    const netAmount = Number(record.amount) - Number(record.discount);
    const totalPaid = Number(record.paid) + paid;
    const newStatus = totalPaid >= netAmount ? "PAID" : "PARTIAL";

    const updated = await prisma.feeRecord.update({
      where: { id },
      data: {
        paid: totalPaid,
        status: newStatus,
        paymentMethod,
        transactionRef: transactionRef || null,
        notes: notes || null,
        paidAt: new Date(),
        collectedById: session.user.id,
      },
    });

    return apiSuccess(updated);
  } catch {
    return apiError("Failed to collect payment", 500);
  }
}
