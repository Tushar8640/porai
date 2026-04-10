import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BD_GRADING_SCALE } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTaka(amount: number | string | { toNumber: () => number }): string {
  const num = typeof amount === "object" ? amount.toNumber() : Number(amount);
  return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateGrade(marksObtained: number, totalMarks: number): { grade: string; gpa: number } {
  const percentage = (marksObtained / totalMarks) * 100;
  for (const entry of BD_GRADING_SCALE) {
    if (percentage >= entry.min && percentage <= entry.max) {
      return { grade: entry.grade, gpa: entry.gpa };
    }
  }
  return { grade: "F", gpa: 0.0 };
}

export function generateStudentId(orgSlug: string, sequence: number): string {
  const slug = orgSlug.toUpperCase().slice(0, 4);
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(3, "0");
  return `${slug}-${year}-${seq}`;
}

export function generateInvoiceNumber(orgSlug: string, sequence: number): string {
  const slug = orgSlug.toUpperCase().slice(0, 6);
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(6, "0");
  return `INV-${slug}-${year}-${seq}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMonth(month: string): string {
  const [year, mon] = month.split("-");
  const date = new Date(parseInt(year), parseInt(mon) - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
