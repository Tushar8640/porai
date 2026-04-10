import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    if (id !== organizationId) return apiError("Forbidden", 403);

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });
    if (!org) return apiError("Not found", 404);
    return apiSuccess(org);
  } catch {
    return apiError("Failed", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    if (id !== organizationId) return apiError("Forbidden", 403);

    const { name, phone, address, district } = await req.json();
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: { name: name || undefined, phone: phone || null, address: address || null, district: district || null },
    });
    return apiSuccess(org);
  } catch {
    return apiError("Failed to update settings", 500);
  }
}
