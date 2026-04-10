import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, apiError, apiSuccess } from "@/lib/tenant";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    const existing = await prisma.teacher.findFirst({ where: { id, organizationId } });
    if (!existing) return apiError("Teacher not found", 404);

    const body = await req.json();
    const updated = await prisma.teacher.update({ where: { id }, data: body });
    return apiSuccess(updated);
  } catch {
    return apiError("Failed to update teacher", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getSessionOrg();
    const { id } = await params;
    const existing = await prisma.teacher.findFirst({ where: { id, organizationId } });
    if (!existing) return apiError("Teacher not found", 404);
    await prisma.teacher.update({ where: { id }, data: { isActive: false } });
    return apiSuccess({ message: "Teacher removed" });
  } catch {
    return apiError("Failed to remove teacher", 500);
  }
}
