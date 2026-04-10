import { z } from "zod";

export const examSchema = z.object({
  name: z.string().min(2, "Exam name must be at least 2 characters").max(100),
  batchId: z.string().min(1, "Batch is required"),
  subject: z.string().max(100).optional().or(z.literal("")),
  examDate: z.string().optional().or(z.literal("")),
  totalMarks: z.coerce.number().int().positive().default(100),
  passMark: z.coerce.number().int().positive().default(33),
});

export const markEntrySchema = z.object({
  results: z.array(
    z.object({
      studentId: z.string(),
      marksObtained: z.coerce.number().min(0),
      isAbsent: z.boolean().default(false),
      remarks: z.string().optional().or(z.literal("")),
    })
  ),
});

export type ExamFormData = z.infer<typeof examSchema>;
export type MarkEntryFormData = z.infer<typeof markEntrySchema>;
