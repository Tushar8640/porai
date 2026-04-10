import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrg, getSession, apiError, apiSuccess } from "@/lib/tenant";
import { studentSchema } from "@/lib/validations/student";
import { generateStudentId } from "@/lib/utils";
import { PLAN_STUDENT_LIMITS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const batchId = searchParams.get("batchId");
    const active = searchParams.get("active");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(active !== null && { isActive: active === "true" }),
      ...(search && { name: { contains: search, mode: "insensitive" as const } }),
      ...(batchId && { enrollments: { some: { batchId, isActive: true } } }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          enrollments: {
            where: { isActive: true },
            include: { batch: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return apiSuccess({ students, total, page, limit });
  } catch {
    return apiError("Failed to fetch students", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const organizationId = await getSessionOrg();
    const body = await req.json();
    const parsed = studentSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422);

    const { name, nameBn, gender, dateOfBirth, phone, guardianName, guardianPhone, address, batchIds } = parsed.data;

    // Check subscription plan student limit
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: true,
        _count: { select: { students: { where: { isActive: true } } } },
      },
    });

    const plan = (org?.subscription?.plan ?? "FREE") as keyof typeof PLAN_STUDENT_LIMITS;
    const limit = PLAN_STUDENT_LIMITS[plan];
    if (org!._count.students >= limit) {
      return apiError(`Student limit reached for ${plan} plan (max ${limit}). Please upgrade.`, 403);
    }

    // Generate sequential studentId
    const lastStudent = await prisma.student.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { studentId: true },
    });

    let seq = 1;
    if (lastStudent) {
      const parts = lastStudent.studentId.split("-");
      seq = parseInt(parts[parts.length - 1]) + 1;
    }

    const orgSlug = org?.slug ?? "STU";
    const studentId = generateStudentId(orgSlug, seq);

    const student = await prisma.$transaction(async (tx) => {
      const s = await tx.student.create({
        data: {
          organizationId,
          studentId,
          name,
          nameBn: nameBn || null,
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          phone: phone || null,
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
          address: address || null,
        },
      });

      if (batchIds && batchIds.length > 0) {
        await tx.enrollment.createMany({
          data: batchIds.map((batchId) => ({ studentId: s.id, batchId })),
          skipDuplicates: true,
        });
      }

      return s;
    });

    return apiSuccess(student, 201);
  } catch (err) {
    console.error(err);
    return apiError("Failed to create student", 500);
  }
}
