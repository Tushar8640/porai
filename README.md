# CoachingHub BD

A multi-tenant SaaS platform for coaching centers in Bangladesh. Each coaching center gets an isolated dashboard to manage students, attendance, fees, and exam results.

## Features

- **Multi-tenant** — every coaching center's data is fully isolated
- **Student management** — profiles, enrollment in batches, auto-generated student IDs
- **Attendance** — per-batch daily marking with Present / Absent / Late; monthly reports
- **Fee tracking** — generate invoices, collect payments, printable receipts
- **Exams & results** — marks entry, automatic BD GPA grading, printable report cards
- **Subscription plans** — FREE (30 students), BASIC (150, ৳500/mo), PRO (unlimited, ৳1200/mo)
- **Super admin** — platform-wide org list, subscription management
- **CSV export** — students, fees, attendance reports
- **BD-specific** — Bengali name support, ৳ currency, 64-district selector, BD phone validation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 (JWT, CredentialsProvider) |
| UI | Tailwind CSS v4 + shadcn/ui v4 (@base-ui/react) |
| Forms | react-hook-form + Zod v4 |
| Charts | Recharts |
| Containerization | Docker + Docker Compose |

---

## Quick Start (Docker)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)

### 1. Clone and configure

```bash
git clone <repo-url>
cd coaching
cp .env.example .env.local
```

Edit `.env.local` and set a strong `NEXTAUTH_SECRET`:

```bash
# Generate a secret
openssl rand -base64 32
```

### 2. Start the full stack

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port `5432`
- **Next.js app** on port `3000` (after running migrations + seed automatically)

Wait ~30 seconds for the app to initialize, then open [http://localhost:3000](http://localhost:3000).

### 3. Default login credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@coachinghub.bd` | `admin123` |
| Demo Center Admin | `demo@dhakacenter.bd` | `demo123` |

> **Change these passwords immediately in production.**

### Stop / Remove

```bash
docker compose down          # stop containers
docker compose down -v       # stop + delete database volume (all data lost)
```

---

## Local Development (app on host, DB in Docker)

This is faster for development — Next.js runs natively with hot reload, only PostgreSQL runs in Docker.

### 1. Start only the database

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment

```bash
cp .env.example .env.local
```

`.env.local` should have:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coaching_db?schema=public"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Run migrations and seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
coaching/
├── prisma/
│   ├── schema.prisma        # All DB models (14 models, 7 enums)
│   └── seed.ts              # Super admin + demo coaching center
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register (no sidebar)
│   │   ├── (dashboard)/     # All center admin/teacher pages
│   │   │   ├── dashboard/   # Stats, charts
│   │   │   ├── students/    # Student CRUD
│   │   │   ├── batches/     # Batch management
│   │   │   ├── attendance/  # Daily marking + reports
│   │   │   ├── fees/        # Fee collection + invoices
│   │   │   ├── exams/       # Exam creation + marks entry
│   │   │   ├── teachers/    # Teacher management
│   │   │   └── settings/    # Org settings + subscription
│   │   ├── (superadmin)/    # Platform admin (SUPER_ADMIN role only)
│   │   │   └── admin/       # All orgs overview + subscription management
│   │   └── api/             # REST API routes
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── layout/          # Sidebar, Topbar, MobileSidebar
│   │   ├── students/        # StudentForm, StudentTable
│   │   ├── attendance/      # AttendanceGrid
│   │   └── shared/          # ConfirmDialog, LoadingSpinner, etc.
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config
│   │   ├── tenant.ts        # getSessionOrg() — org isolation
│   │   ├── utils.ts         # formatTaka, calculateGrade, etc.
│   │   └── constants.ts     # Plan limits, BD districts, grading scale
│   └── middleware.ts        # Auth guard + role-based routing
├── docker-compose.yml       # Full stack (app + PostgreSQL)
├── docker-compose.dev.yml   # DB only (for local dev)
├── Dockerfile               # Multi-stage production build
└── .env.example             # Environment variable template
```

---

## Available Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio (database browser)
npm run db:generate  # Regenerate Prisma client after schema changes
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/organizations` | Register new coaching center |
| GET/PATCH | `/api/organizations/[id]` | Get/update org settings |
| GET/POST | `/api/students` | List students / create student |
| GET/PATCH/DELETE | `/api/students/[id]` | Student detail / edit / deactivate |
| GET/POST | `/api/batches` | List / create batches |
| GET/PATCH/DELETE | `/api/batches/[id]` | Batch detail / edit / delete |
| GET/POST | `/api/attendance` | Get attendance for date / bulk save |
| GET | `/api/attendance/student` | Student attendance history |
| GET/POST | `/api/fees` | List fees / generate fee records |
| PATCH | `/api/fees/[id]` | Collect payment |
| GET/POST | `/api/exams` | List / create exams |
| GET/POST | `/api/exams/[id]/marks` | Get/save marks for exam |
| GET/POST | `/api/teachers` | List / create teachers |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/export/students` | Download students CSV |
| GET | `/api/export/fees` | Download fees CSV |
| GET | `/api/export/attendance` | Download attendance CSV |
| PATCH | `/api/admin/organizations/[id]/subscription` | Super admin: update subscription |

---

## Subscription Plans

| Plan | Students | Monthly Fee |
|------|----------|-------------|
| FREE | Up to 30 | Free |
| BASIC | Up to 150 | ৳500 |
| PRO | Unlimited | ৳1,200 |

To upgrade a center's plan: log in as Super Admin → Platform Overview → Manage.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `NEXTAUTH_URL` | Yes | App base URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | No | Displayed app name (default: CoachingHub BD) |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL |

---

## Roles

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Platform admin at `/admin` — sees all orgs |
| `CENTER_ADMIN` | Full access to their coaching center dashboard |
| `TEACHER` | Read-only access to students, attendance marking |
| `STUDENT` | Student portal only (future) |

---

## Production Deployment

### Docker Compose (VPS)

```bash
# On your server
git clone <repo-url> && cd coaching
cp .env.example .env.local
# Edit .env.local with production values and a strong NEXTAUTH_SECRET
docker compose up -d
```

### Reverse Proxy (nginx example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use [Certbot](https://certbot.eff.org/) to add SSL.

---

## BD Grading Scale

| Grade | Marks (%) | GPA |
|-------|-----------|-----|
| A+ | 80–100 | 5.0 |
| A | 70–79 | 4.0 |
| A- | 60–69 | 3.5 |
| B | 50–59 | 3.0 |
| C | 40–49 | 2.0 |
| D | 33–39 | 1.0 |
| F | < 33 | 0.0 |
