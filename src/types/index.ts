import type {
  Role,
  SubscriptionPlan,
  AttendanceStatus,
  FeeStatus,
  PaymentMethod,
  Gender,
} from "@/generated/prisma";

export type { Role, SubscriptionPlan, AttendanceStatus, FeeStatus, PaymentMethod, Gender };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string | null;
  image?: string | null;
}

export interface StudentWithBatches {
  id: string;
  studentId: string;
  name: string;
  nameBn?: string | null;
  gender: Gender;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  isActive: boolean;
  joinDate: Date;
  enrollments: { batch: { id: string; name: string } }[];
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus | null;
  note?: string | null;
}

export interface FeeRecordWithStudent {
  id: string;
  invoiceNumber: string;
  feeMonth: string;
  amount: string;
  discount: string;
  paid: string;
  status: FeeStatus;
  dueDate: Date;
  paymentMethod?: PaymentMethod | null;
  transactionRef?: string | null;
  paidAt?: Date | null;
  student: {
    id: string;
    name: string;
    studentId: string;
  };
  batch?: {
    id: string;
    name: string;
  } | null;
}

export interface ExamResultWithStudent {
  id: string;
  marksObtained: string;
  grade?: string | null;
  isAbsent: boolean;
  remarks?: string | null;
  student: {
    id: string;
    name: string;
    studentId: string;
  };
}

export interface DashboardStats {
  totalStudents: number;
  activeBatches: number;
  todayAttendanceRate: number;
  totalMonthlyDues: number;
  newStudentsThisMonth: number;
}
