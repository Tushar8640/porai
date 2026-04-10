import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Super admin
  const superAdminPassword = await bcrypt.hash("admin123", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@coachinghub.bd" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@coachinghub.bd",
      password: superAdminPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Super admin created:", superAdmin.email);

  // Demo coaching center
  const demoOrg = await prisma.organization.upsert({
    where: { slug: "demo-coaching" },
    update: {},
    create: {
      name: "Demo Coaching Center",
      slug: "demo-coaching",
      phone: "01711234567",
      address: "Mirpur, Dhaka",
      district: "Dhaka",
    },
  });

  // Demo admin
  const demoAdminPassword = await bcrypt.hash("demo1234", 12);
  const demoAdmin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Demo Admin",
      email: "admin@demo.com",
      password: demoAdminPassword,
      role: "CENTER_ADMIN",
      organizationId: demoOrg.id,
    },
  });
  console.log("Demo admin created:", demoAdmin.email);

  // Demo subscription
  await prisma.subscription.upsert({
    where: { organizationId: demoOrg.id },
    update: {},
    create: {
      organizationId: demoOrg.id,
      plan: "BASIC",
      status: "ACTIVE",
      monthlyAmount: 500,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Demo teacher
  const demoTeacher = await prisma.teacher.upsert({
    where: { userId: demoAdmin.id },
    update: {},
    create: {
      organizationId: demoOrg.id,
      name: "Md. Rahim Uddin",
      phone: "01811234567",
      subject: "Mathematics",
      userId: demoAdmin.id,
    },
  });

  // Demo batch
  const demoBatch = await prisma.batch.upsert({
    where: { id: "demo-batch-1" },
    update: {},
    create: {
      id: "demo-batch-1",
      organizationId: demoOrg.id,
      name: "Class 10 - Science (Morning)",
      subject: "Mathematics, Physics, Chemistry",
      schedule: "Sat, Mon, Wed — 8:00 AM",
      teacherId: demoTeacher.id,
      monthlyFee: 800,
    },
  });

  // Demo students
  const students = [
    { name: "Aminul Islam", studentId: "DEMO-2024-001", gender: "MALE" as const, guardianPhone: "01911234567" },
    { name: "Fatema Khatun", studentId: "DEMO-2024-002", gender: "FEMALE" as const, guardianPhone: "01811234568" },
    { name: "Rakibul Hasan", studentId: "DEMO-2024-003", gender: "MALE" as const, guardianPhone: "01711234568" },
  ];

  for (const s of students) {
    const student = await prisma.student.upsert({
      where: { organizationId_studentId: { organizationId: demoOrg.id, studentId: s.studentId } },
      update: {},
      create: {
        organizationId: demoOrg.id,
        studentId: s.studentId,
        name: s.name,
        gender: s.gender,
        guardianPhone: s.guardianPhone,
      },
    });

    await prisma.enrollment.upsert({
      where: { studentId_batchId: { studentId: student.id, batchId: demoBatch.id } },
      update: {},
      create: { studentId: student.id, batchId: demoBatch.id },
    });
  }

  console.log("Demo data seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("  Super Admin: superadmin@coachinghub.bd / admin123");
  console.log("  Demo Admin:  admin@demo.com / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
