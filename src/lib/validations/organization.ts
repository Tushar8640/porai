import { z } from "zod";

export const registerSchema = z.object({
  orgName: z.string().min(3, "Center name must be at least 3 characters").max(100),
  district: z.string().min(1, "District is required"),
  phone: z
    .string()
    .regex(/^(\+8801|01)[3-9]\d{8}$/, "Invalid BD phone number")
    .optional()
    .or(z.literal("")),
  adminName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
