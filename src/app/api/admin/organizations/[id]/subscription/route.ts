import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, getSession } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["FREE", "BASIC", "PRO"]),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]),
  endDate: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (session.user.role !== "SUPER_ADMIN") return apiError("Forbidden", 403);

    const { id: orgId } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const { plan, status, endDate } = parsed.data;

    const sub = await prisma.subscription.upsert({
      where: { organizationId: orgId },
      update: {
        plan,
        status,
        endDate: endDate ? new Date(endDate) : null,
        monthlyAmount: plan === "FREE" ? 0 : plan === "BASIC" ? 500 : 1200,
      },
      create: {
        organizationId: orgId,
        plan,
        status,
        startDate: new Date(),
        endDate: endDate ? new Date(endDate) : null,
        monthlyAmount: plan === "FREE" ? 0 : plan === "BASIC" ? 500 : 1200,
      },
    });

    return apiSuccess(sub);
  } catch {
    return apiError("Failed to update subscription", 500);
  }
}
