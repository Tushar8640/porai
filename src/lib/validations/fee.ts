import { z } from "zod";

export const generateFeesSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  feeMonth: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format (YYYY-MM)"),
  amount: z.coerce.number().positive("Amount must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
});

export const collectPaymentSchema = z.object({
  paid: z.coerce.number().positive("Payment amount must be positive"),
  paymentMethod: z.enum(["CASH", "BKASH", "NAGAD", "ROCKET", "BANK_TRANSFER"]),
  transactionRef: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type GenerateFeesFormData = z.infer<typeof generateFeesSchema>;
export type CollectPaymentFormData = z.infer<typeof collectPaymentSchema>;
