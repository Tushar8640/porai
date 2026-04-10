import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/organization";
import { slugify } from "@/lib/utils";
import { apiError, apiSuccess } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const { orgName, district, phone, adminName, email, password } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiError("Email already registered", 409);
    }

    // Generate unique slug
    let slug = slugify(orgName);
    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create org + user + subscription in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          phone: phone || null,
          district,
        },
      });

      const user = await tx.user.create({
        data: {
          name: adminName,
          email,
          password: hashedPassword,
          role: "CENTER_ADMIN",
          organizationId: org.id,
        },
      });

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          plan: "FREE",
          status: "ACTIVE",
          monthlyAmount: 0,
        },
      });

      return { org, user };
    });

    return apiSuccess(
      { message: "Organization registered successfully", orgId: result.org.id },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return apiError("Failed to register organization", 500);
  }
}
