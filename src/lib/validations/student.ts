import { z } from "zod";

const bdPhone = z
  .string()
  .regex(/^(\+8801|01)[3-9]\d{8}$/, "Invalid BD phone number")
  .optional()
  .or(z.literal(""));

export const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  nameBn: z.string().max(100).optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().optional().or(z.literal("")),
  phone: bdPhone,
  guardianName: z.string().max(100).optional().or(z.literal("")),
  guardianPhone: bdPhone,
  address: z.string().max(300).optional().or(z.literal("")),
  batchIds: z.array(z.string()).optional().default([]),
});

export type StudentFormData = z.infer<typeof studentSchema>;
