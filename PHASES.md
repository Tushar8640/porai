# Coaching Center Management System — Build Phases

## Phase 0: Project Bootstrap ✅
- Next.js 16 + TypeScript + Tailwind CSS + App Router
- shadcn/ui init + components (button, card, input, select, dialog, badge, form, etc.)
- Dependencies: prisma, next-auth, bcryptjs, zod, react-hook-form, tanstack-table, recharts
- Prisma init with PostgreSQL
- `.env.local` setup

---

## Phase 1: Database Schema & Auth ✅
- `prisma/schema.prisma` — all 14 models + 7 enums
- `src/lib/prisma.ts` — singleton Prisma client
- `src/lib/auth.ts` — NextAuth v5, CredentialsProvider, JWT (role + organizationId)
- `src/types/next-auth.d.ts` — extend session types
- `src/middleware.ts` — route protection + role-based redirects
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/organizations/route.ts` — POST register (Org + User + Subscription in $transaction)
- Login page (`/login`)
- Register page (`/register`) — 2-step: center details → admin account
- `prisma/seed.ts` — super admin + demo center + students
- `src/lib/utils.ts` — formatTaka, calculateGrade, generateStudentId, etc.
- `src/lib/constants.ts` — plan limits, BD districts, grading scale
- `src/lib/tenant.ts` — getSessionOrg(), apiError(), apiSuccess()
- Zod schemas: student, organization, fee, exam

---

## Phase 2: Dashboard Layout & Navigation
- `src/app/(dashboard)/layout.tsx` — sidebar + topbar shell
- `src/components/layout/Sidebar.tsx` — nav links, role-based visibility, active state
- `src/components/layout/Topbar.tsx` — org name, user avatar dropdown, sign out
- `src/components/layout/MobileSidebar.tsx` — Sheet-based mobile nav
- `src/components/layout/PageHeader.tsx` — reusable page title + action buttons
- `src/app/(auth)/layout.tsx` — centered card layout for login/register
- `src/components/shared/EmptyState.tsx` — reusable empty state
- `src/components/shared/ConfirmDialog.tsx` — delete confirmation dialog
- `src/components/shared/LoadingSpinner.tsx`

---

## Phase 3: Student Management
**API Routes:**
- `GET/POST /api/students` — list (search, filter, paginate) + create
- `GET/PATCH/DELETE /api/students/[id]` — profile, update, soft-delete
- `GET/POST /api/batches` — list + create
- `GET/PATCH/DELETE /api/batches/[id]`
- `POST/DELETE /api/batches/[id]/enroll` — enroll/remove student

**Components:**
- `StudentForm.tsx` — react-hook-form + Zod, all fields, batch multi-select
- `StudentTable.tsx` — TanStack Table, sortable, row actions
- `BatchCard.tsx` — batch info card

**Pages:**
- `/students` — list with search + batch filter
- `/students/new` — add student form
- `/students/[id]` — profile with tabs (Info | Attendance | Fees | Results)
- `/students/[id]/edit` — edit form
- `/batches` — batch list
- `/batches/new` — create batch
- `/batches/[id]` — batch detail + enrolled students

---

## Phase 4: Attendance System
**API Routes:**
- `GET /api/attendance?batchId=&date=` — students with their status for that date
- `POST /api/attendance` — bulk upsert (idempotent)
- `GET /api/attendance/reports?batchId=&month=` — P/A/L count per student
- `GET /api/attendance/student/[id]?month=` — individual monthly view

**Components:**
- `AttendanceGrid.tsx` — P/A/L toggle per student row, "Mark All Present" button
- `AttendanceStatusBadge.tsx` — colored badge

**Pages:**
- `/attendance` — batch + date selector → redirect to mark page
- `/attendance/mark` — grid UI + save
- `/attendance/reports` — month picker, summary table (red if <75%)

---

## Phase 5: Fee Tracking
**API Routes:**
- `POST /api/fees` — generate fee records for batch+month
- `GET /api/fees?status=&month=&batchId=` — filtered list
- `PATCH /api/fees/[id]` — collect payment, update status
- `GET /api/fees/invoices/[id]` — invoice data for print
- `GET /api/fees/dues` — students with outstanding dues

**Components:**
- `FeeCollectionForm.tsx` — amount, payment method (Cash/bKash/Nagad/Rocket/Bank), transaction ref
- `DuesTable.tsx` — dues list with status badges
- `InvoicePrint.tsx` — print-optimized A4 receipt with ৳ amounts

**Pages:**
- `/fees` — overview (total collected, outstanding), dues table
- `/fees/collect` — collect payment form
- `/fees/invoices/[id]` — printable invoice/receipt

---

## Phase 6: Exams & Results
**API Routes:**
- `GET/POST /api/exams?batchId=` — list + create
- `GET/PATCH/DELETE /api/exams/[id]`
- `GET/POST /api/exams/[id]/marks` — bulk marks entry (upsert)
- `GET /api/exams/[id]/results` — ranked result sheet with BD grades

**Components:**
- `ExamForm.tsx`
- `MarksEntryTable.tsx` — inline editable grid, absent checkbox, 0–totalMarks validation
- `ReportCard.tsx` — printable A4: student photo, center header, subjects table, GPA, signature lines
- BD grading logic in `lib/utils.ts` → `calculateGrade(marks, totalMarks)`

**Pages:**
- `/exams` — exam list
- `/exams/new` — create exam
- `/exams/[id]` — marks entry table
- `/exams/[id]/results` — ranked result sheet + export CSV + print report cards

---

## Phase 7: Dashboard Stats & Subscription
**API Routes:**
- `GET /api/dashboard/stats` — active students, today attendance %, total dues, upcoming exams, new students this month

**Components:**
- `StatCard.tsx` — icon, label, value, trend
- `AttendanceSummaryChart.tsx` — Recharts BarChart (7-day attendance per batch)
- `RecentPayments.tsx` — last 5 fee payments table

**Pages:**
- `/dashboard` — 4 stat cards + chart + recent payments + subscription warning banner
- `/settings` — org info form + subscription plan display
- `/settings/subscription` — plan comparison, upgrade UI

**Subscription enforcement:**
- `POST /api/students` → block if student count >= plan limit (FREE=30, BASIC=150, PRO=∞)
- Expired subscription → redirect CENTER_ADMIN to `/settings/subscription`

---

## Phase 8: Polish & Super Admin
**Super Admin:**
- `src/app/(superadmin)/admin/page.tsx` — all orgs table (name, plan, student count, status)
- `src/app/(superadmin)/admin/organizations/page.tsx` — detailed view
- `PATCH /api/admin/organizations/[id]/subscription` — manually set plan

**Polish:**
- CSV export: student list, attendance reports, fee reports
- Mobile responsiveness audit for all pages
- Loading skeletons for all data tables
- Error boundaries
- Student portal (`/student-portal`) — attendance calendar + results + fees (read-only)
- Teachers CRUD: `/teachers`, `/teachers/new`

---

## Tech Stack Summary
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Prisma ORM v7 |
| Auth | NextAuth.js v5 (beta) |
| UI | Tailwind CSS v4 + shadcn/ui v4 |
| Forms | react-hook-form + Zod v4 |
| Tables | TanStack Table v8 |
| Charts | Recharts v3 |
| Dates | date-fns v4 |
| BD Font | Hind Siliguri (Google Fonts) |
