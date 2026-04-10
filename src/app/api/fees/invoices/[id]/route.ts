import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;

    const [record, org] = await Promise.all([
      prisma.feeRecord.findFirst({
        where: { id, organizationId },
        include: {
          student: { select: { id: true, name: true, nameBn: true, studentId: true, guardianName: true, guardianPhone: true, address: true } },
          batch: { select: { id: true, name: true } },
        },
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true, phone: true, address: true, district: true, logoUrl: true },
      }),
    ]);

    if (!record) return apiError("Invoice not found", 404);

    return apiSuccess({ record, org });
  } catch {
    return apiError("Failed to fetch invoice", 500);
  }
}
