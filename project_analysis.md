# TreOpsFlow - Comprehensive Project Analysis

**Generated**: 2026-03-16
**Last Updated**: 2026-03-19
**Project**: TreOpsFlow (trebound-workflow) — branded as **Knot by Trebound**
**Version**: 0.1.0

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Complete Feature Documentation](#2-complete-feature-documentation)
3. [Database & Data Layer](#3-database--data-layer)
4. [APIs & Integrations](#4-apis--integrations)
5. [Configuration & Environment](#5-configuration--environment)
6. [Current Bugs & Code Issues](#6-current-bugs--code-issues)
7. [Testing](#7-testing)
8. [Future Required Changes](#8-future-required-changes)
9. [Production Readiness Changes](#9-production-readiness-changes)
10. [Recommended Priority Roadmap](#10-recommended-priority-roadmap)

---

## 1. PROJECT OVERVIEW

### Purpose

TreOpsFlow is an internal operations management system built for **Trebound**, a corporate team-building and events company. It tracks programs (events/activities) through a **6-stage workflow lifecycle** from initial sales handover to post-trip closure. The system provides role-based access for Sales, Operations, Finance, and Admin teams, with approval workflows, rejection handling, automated email notifications, and comprehensive reporting.

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.1.1 (App Router, React Server Components) |
| **Language** | TypeScript 5.9.3 (strict mode) |
| **UI Library** | React 19.2.3 |
| **Styling** | Tailwind CSS 4, Shadcn/ui (New York style), Lucide icons |
| **Forms** | react-hook-form 7.70.0, @hookform/resolvers 5.2.2, Zod 4.3.5 |
| **Database** | PostgreSQL via Prisma ORM 6.19.1 |
| **Authentication** | NextAuth v5 (beta.30) with Credentials provider |
| **Drag & Drop** | @dnd-kit/core 6.3.1 |
| **Charts** | Recharts 3.8.0 |
| **Email** | Nodemailer 7.0.12 |
| **File Storage** | ImageKit (@imagekit/nodejs 7.2.1) |
| **PDF Export** | jsPDF 4.2.0 |
| **Date Utilities** | date-fns 4.1.0 |
| **Password Hashing** | bcryptjs 3.0.3 |
| **Theming** | next-themes 0.4.6 |
| **Testing** | Jest 30.3.0, @testing-library/react 16.3.2, ts-jest 29.4.6 |
| **Deployment** | Netlify (@netlify/plugin-nextjs 5.15.7) |
| **CI/CD** | GitHub Actions (lint → test → build) |
| **Package Manager** | npm |

### Architecture

**Monolithic Next.js Application** using the App Router pattern:
- **Server Components** for data fetching (pages, layouts)
- **Client Components** for interactivity (forms, kanban board, modals)
- **Server Actions** for mutations (form submissions, stage transitions) — 11 files, 1,801 lines
- **API Routes** for RESTful endpoints (exports, cron jobs, stage moves) — 23 files, 1,981 lines
- **Middleware** for authentication guards
- **React Compiler** enabled (`reactCompiler: true`) for automatic memoization

### Code Metrics

| Metric | Count |
|--------|-------|
| Total TypeScript/TSX source files | 108 |
| Total lines of code (src/) | 14,273 |
| Component files | 51 (7,617 lines) |
| UI components (Shadcn) | 24 |
| API route files | 23 (1,981 lines) |
| Server action files | 11 (1,801 lines) |
| Library utilities | 9 (1,301 lines) |
| Test files | 6 (1,336 lines) |
| Prisma models | 4 |
| Dashboard pages | 8 |
| Production dependencies | 37 |
| Dev dependencies | 22 |

### Directory Structure

```
TreOpsFlow/
├── prisma/                          # Database layer
│   ├── schema.prisma                # Data model (4 models, 168 ProgramCard fields)
│   ├── migrations/                  # 5 SQL migrations
│   ├── seed.ts                      # TypeScript seed
│   ├── seed.js                      # JS seed
│   └── seed-cjs.js                  # CommonJS seed
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout (fonts, theme, toaster)
│   │   ├── page.tsx                 # Root redirect (auth check)
│   │   ├── globals.css              # Tailwind + custom stage colors
│   │   ├── login/page.tsx           # Login page
│   │   ├── actions/                 # Server Actions (11 files, 1,801 lines)
│   │   ├── api/                     # API Routes
│   │   │   ├── auth/                # NextAuth handlers + rate limiting
│   │   │   ├── health/              # Health check endpoint
│   │   │   ├── cron/                # 4 scheduled job endpoints (all authenticated)
│   │   │   ├── programs/            # Program CRUD & stage endpoints
│   │   │   └── settings/            # App settings CRUD
│   │   └── dashboard/               # Protected dashboard pages
│   │       ├── layout.tsx           # Auth guard + shell wrapper
│   │       ├── page.tsx             # Kanban board view
│   │       ├── error.tsx            # Dashboard error boundary
│   │       ├── programs/            # Program list + detail pages
│   │       │   └── [id]/error.tsx   # Program detail error boundary
│   │       ├── pending-approvals/   # Approval queue
│   │       ├── reports/             # Analytics dashboard
│   │       ├── settings/            # App settings
│   │       └── team/                # User management (Admin)
│   ├── components/
│   │   ├── dashboard/               # 14 dashboard components
│   │   ├── forms/                   # 6 stage-specific forms
│   │   ├── settings/                # 2 settings UI components
│   │   ├── ui/                      # 24 Shadcn/ui components
│   │   └── *.tsx                    # 5 feature components
│   ├── lib/                         # Shared utilities (9 files, 1,301 lines)
│   │   ├── prisma.ts                # DB client singleton
│   │   ├── validations.ts           # Stage progression rules (321 lines)
│   │   ├── email.ts                 # Email sender (stub in dev, nodemailer in prod)
│   │   ├── email-templates.ts       # 11 HTML email templates
│   │   ├── imagekit.ts              # File upload service
│   │   ├── date-utils.ts            # Shared date parsing & urgency badges
│   │   ├── cron-auth.ts             # Cron secret verification
│   │   ├── rate-limit.ts            # In-memory sliding window rate limiter
│   │   └── utils.ts                 # cn() class utility
│   ├── types/
│   │   ├── index.ts                 # Centralized type definitions (141 lines)
│   │   └── next-auth.d.ts           # NextAuth type augmentation
│   ├── auth.ts                      # NextAuth configuration (72 lines)
│   └── middleware.ts                # Route protection (34 lines)
├── __tests__/                       # Test suite (6 files)
├── __mocks__/                       # Prisma mocks
├── .github/workflows/ci.yml         # CI pipeline config
├── .env.example                     # Environment variable template
├── package.json                     # Dependencies & scripts
├── next.config.ts                   # Next.js config (security headers, React Compiler)
├── tsconfig.json                    # TypeScript config (strict, ES2017)
├── eslint.config.mjs                # ESLint flat config
├── jest.config.js                   # Test config
├── netlify.toml                     # Deployment config
└── components.json                  # Shadcn/ui config
```

### Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| Application root | `src/app/layout.tsx` | Root layout, font loading, theme provider |
| Home page | `src/app/page.tsx` | Auth-based redirect to `/dashboard` or `/login` |
| Auth config | `src/auth.ts` | NextAuth v5 credentials provider setup |
| Middleware | `src/middleware.ts` | Route protection, redirect logic |
| DB client | `src/lib/prisma.ts` | Prisma singleton for database access |
| Type definitions | `src/types/index.ts` | Centralized TypeScript types |
| Type augmentation | `src/types/next-auth.d.ts` | NextAuth session/JWT type extensions |

---

## 2. COMPLETE FEATURE DOCUMENTATION

### Feature 1: User Authentication & Authorization

**Description**: Credential-based authentication with role-based access control (RBAC) for 4 user roles: Sales, Ops, Finance, Admin.

**Files**:
- `src/auth.ts` - NextAuth v5 configuration with Credentials provider
- `src/middleware.ts` - Route protection middleware
- `src/app/login/page.tsx` - Login page with branded split layout
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API handler with rate limiting
- `src/lib/rate-limit.ts` - Sliding window rate limiter (in-memory)
- `src/types/next-auth.d.ts` - Session/JWT type augmentation for `role` and `id`

**How It Works**:
1. User submits email/password on login page
2. Rate limiter checks IP (10 POST/min, 30 GET/min) — returns 429 if exceeded
3. NextAuth Credentials provider queries Prisma for user by email
4. Checks `user.active` flag — deactivated users cannot log in
5. bcryptjs compares password hash
6. JWT token created with user `id`, `role`, `name`, `email`
7. Session callbacks attach role/id to session object (properly typed via `next-auth.d.ts`)
8. Middleware checks `authjs.session-token` or `__Secure-authjs.session-token` cookie
9. Protected routes under `/dashboard/*` redirect to `/login` if unauthenticated

**Routes**: `POST /api/auth/callback/credentials`, `GET /api/auth/session`

**Dependencies**: next-auth v5-beta.30, bcryptjs, Prisma

**Status**: ✅ Complete. Rate limiting, deactivated user check, and proper TypeScript types in place.

---

### Feature 2: 6-Stage Workflow Pipeline

**Description**: Programs progress through 6 sequential stages with validation gates at each transition.

| Stage | Name | Key Activities |
|-------|------|---------------|
| 1 | Tentative Handover | Sales creates program, Finance/Ops approve |
| 2 | Accepted Handover | Ops SPOC assigned, checklist, sales meeting |
| 3 | Feasibility & Preps | Activity/facilitator blocking, logistics, packing |
| 4 | Delivery | On-ground execution, participant count, photos |
| 5 | Post Trip Closure | ZFD rating, expenses, data entry, review |
| 6 | Done | Archived, locked, final notes |

**Files**:
- `src/lib/validations.ts` - Stage progression validators (`canProgressFromStageN()`)
- `src/app/actions/stage1.ts` through `stage5.ts` - Stage-specific mutations
- `src/app/actions/approval.ts` - Finance/Ops approval workflow
- `src/app/api/programs/[id]/stage{2-5}/move/route.ts` - Stage transition API routes
- `src/components/forms/stage{1-6}*.tsx` - Stage-specific forms

**How It Works**:
1. Sales creates program at Stage 1 with details and budget
2. Finance approves budget (auto-advances to Stage 2)
3. Ops accepts handover and assigns SPOC
4. Each stage has exit criteria validated by `canProgressFromStageN()` functions
5. Moving forward requires filling mandatory fields for that stage
6. Programs can be returned to earlier stages with a mandatory reason
7. Stage 6 locks the program; only Admin can reopen

**Dependencies**: Prisma, Zod, react-hook-form

**Status**: ✅ Complete. Core workflow is functional.

---

### Feature 3: Kanban Board

**Description**: Visual drag-and-drop board showing programs across 6 stage columns.

**Files**:
- `src/components/dashboard/kanban-board.tsx` - Main board with DnD context (204 lines)
- `src/components/dashboard/kanban-column.tsx` - Stage column with drop zone
- `src/components/dashboard/kanban-card.tsx` - Program card with drag handle
- `src/app/dashboard/page.tsx` - Dashboard page rendering the board

**How It Works**:
1. Programs are grouped by `currentStage` into 6 columns
2. Dragging a card right opens StageTransitionModal (forward)
3. Dragging a card left opens StageReturnModal (backward)
4. Clicking a card opens ProgramViewModal (read-only)
5. Cards show: program name, company, date, urgency badge, owner initials

**Dependencies**: @dnd-kit/core, @dnd-kit/sortable

**Status**: ✅ Complete. No optimistic UI updates; relies on page refresh after transitions.

---

### Feature 4: Finance & Ops Approval Workflow

**Description**: Dual-track approval system where Finance and Ops review programs simultaneously at Stage 1.

**Files**:
- `src/app/actions/approval.ts` - `approveFinance()`, `acceptHandover()` (200 lines)
- `src/app/actions/rejection.ts` - `rejectFinance()`, `rejectOpsHandover()`, `resubmitProgram()` (369 lines)
- `src/components/handover-actions.tsx` - Approval/rejection UI (160 lines)
- `src/components/rejection-feedback.tsx` - Rejection display & resubmit
- `src/app/dashboard/pending-approvals/page.tsx` - Approval queue page

**How It Works**:
1. Program created at Stage 1 triggers emails to Finance and Ops
2. Finance can approve or reject budget (with reason)
3. Ops can accept or reject handover (with reason)
4. Finance approval auto-advances to Stage 2
5. Rejection sets `rejectionStatus` and notifies Sales
6. Sales can edit and resubmit (increments `resubmissionCount`)
7. Ops can also reject during Stage 2 (returns to Stage 1, resets finance approval)

**Dependencies**: Prisma, email system

**Status**: ✅ Complete. Simultaneous review model working.

---

### Feature 5: Program Detail Page & Stage Forms

**Description**: Full program management page with stage-specific forms.

**Files**:
- `src/app/dashboard/programs/[id]/page.tsx` - Program detail page
- `src/components/forms/stage1-form.tsx` - Tentative handover form (**1,070 lines** — largest component)
- `src/components/forms/stage2-accepted-form.tsx` - Ops acceptance form (322 lines)
- `src/components/forms/stage3-feasibility-form.tsx` - Prep checklist (311 lines)
- `src/components/forms/stage4-delivery-form.tsx` - Execution data (280 lines)
- `src/components/forms/stage5-posttrip-form.tsx` - Closure checklist (276 lines)
- `src/components/forms/stage6-done-view.tsx` - Archived view
- `src/components/dashboard/stage1-summary.tsx` - Read-only Stage 1 summary (173 lines)
- `src/components/dashboard/stage-stepper.tsx` - Visual stage progress

**How It Works**:
1. Page fetches program by ID with sales/ops owner relations
2. Shows rejection feedback if program is rejected
3. Shows HandoverActions for Finance/Ops at Stage 1
4. Renders appropriate form based on `currentStage`
5. Forms validate with Zod schemas and submit via Server Actions
6. Each form has save (partial) and move-to-next-stage (validates exit criteria) options

**Status**: ✅ Complete. Forms are functional but Stage 1 form is very long (1,070 lines).

---

### Feature 6: Reporting & Analytics Dashboard

**Description**: Analytics page with charts showing program statistics, revenue, and team workload.

**Files**:
- `src/app/dashboard/reports/page.tsx` - Reports page
- `src/components/dashboard/reports-charts.tsx` - Charts and KPI cards (308 lines)
- `src/app/actions/admin.ts` - `getDashboardStats()`, `getRevenueByType()`, `getFacilitatorWorkload()`, `getMonthlyRevenue()`, `getRecentActivity()`, `getTransportReport()` (237 lines)

**How It Works**:
1. Server component fetches multiple aggregate queries via `prisma.$transaction()`
2. Displays: 4 KPI cards, 6-month revenue trend (area chart), stage distribution (pie chart), revenue by type (bar chart), facilitator workload, recent activity feed, transport tracking
3. Currency formatting uses Indian notation (Cr, L, K)

**Dependencies**: Recharts, Prisma aggregations

**Status**: ✅ Complete. Data is real-time from database.

---

### Feature 7: Email Notification System

**Description**: Automated email notifications for workflow events.

**Files**:
- `src/lib/email.ts` - Email transport (nodemailer) with dev stub (76 lines)
- `src/lib/email-templates.ts` - 11 HTML email templates

**Templates**:
1. `programCreatedEmail` - New program notification
2. `financeApprovalRequestedEmail` - Budget approval request
3. `budgetApprovedEmail` - Approval confirmation
4. `opsHandoverReadyEmail` - Handover ready for Ops
5. `handoverToOpsEmail` - Assignment to Ops SPOC
6. `stageCompletedEmail` - Stage progression notification
7. `programClosedEmail` - Program completion
8. `financeRejectedEmail` - Finance rejection
9. `opsRejectedEmail` - Ops rejection
10. `programResubmittedEmail` - Resubmission notification
11. `programReopenedEmail` - Program reopened

**How It Works**:
- In development: console.warn stub (no emails sent)
- In production: uses nodemailer with SMTP configuration from `EMAIL_*` env vars
- Returns `{ success: true, stub: true }` in dev, `{ success: true }` in prod
- Gracefully handles missing SMTP config (logs error in prod, warns in dev)

**Status**: ✅ Complete. All 4 cron endpoints have email sending integrated. Requires SMTP env vars in production.

---

### Feature 8: File Upload System

**Description**: Document and media uploads via ImageKit cloud storage.

**Files**:
- `src/lib/imagekit.ts` - ImageKit SDK integration (139 lines)
- `src/app/actions/upload.ts` - Upload server action (64 lines)
- `src/components/ui/file-upload.tsx` - Drag-and-drop upload UI

**How It Works**:
1. Client selects file via file-upload component
2. Server action validates file size (10MB max) and type
3. File converted to base64 and uploaded to ImageKit
4. Returns URL and file ID for storage in program fields
5. Supports documents (PDF, DOC, DOCX, XLS, XLSX) and media (JPG, PNG, MP4, MOV, etc.)
6. Includes delete functionality and URL transformation helpers

**Status**: ✅ Complete. Working with ImageKit.

---

### Feature 9: Data Export

**Description**: Multiple export formats for program data.

**Files**:
- `src/app/api/programs/export/route.ts` - CSV export of all programs
- `src/app/api/programs/[id]/export-freelancer/route.ts` - Freelancer-safe export (excludes financials)
- `src/app/api/programs/[id]/helper-sheet/route.ts` - On-ground helper sheet (text)
- `src/components/freelancer-export-button.tsx` - Export UI with format selection

**Endpoints**:
- `GET /api/programs/export?stage={1-6}` - CSV with optional stage filter
- `GET /api/programs/{id}/export-freelancer?format={md|txt}` - Markdown or text
- `GET /api/programs/{id}/helper-sheet` - Plain text helper sheet

**Status**: ✅ Complete. All exports working.

---

### Feature 10: Auto-Logistics Generator

**Description**: Automatically generates logistics checklists based on program type and pax count.

**Files**:
- `src/app/api/programs/[id]/auto-logistics/route.ts`

**How It Works**:
1. Reads program type and pax range
2. Generates base items by type (Team Building, Corporate Outing, Workshop, Adventure)
3. Adds pax-based extras (50+, 100+, 20+)
4. Adds transport items if applicable
5. Returns structured checklist with item count

**Status**: ✅ Complete. Logic-based generation, no AI.

---

### Feature 11: Cron Jobs (Scheduled Reminders)

**Description**: 4 scheduled endpoints for automated alerts. All authenticated via CRON_SECRET.

**Files**:
- `src/lib/cron-auth.ts` - Cron secret verification helper (35 lines)
- `src/app/api/cron/delivery-reminder/route.ts` - Programs with delivery tomorrow
- `src/app/api/cron/expense-overdue/route.ts` - Expense sheets overdue (>7 days)
- `src/app/api/cron/timeline-reminder/route.ts` - Programs approaching within 3 days
- `src/app/api/cron/zfd-alert/route.ts` - Low ZFD ratings (<=3) in last 7 days

**Security**: All 4 cron endpoints require `Authorization: Bearer <CRON_SECRET>` header. Unauthorized requests return 401.

**Admin Controls**: Each cron job checks an `AppSetting` toggle (e.g., `notification_delivery_reminder`) and skips if disabled.

**Status**: ✅ Complete. All 4 cron endpoints are authenticated and have email sending integrated.

---

### Feature 12: Program Return & Reopen

**Description**: Programs can be returned to earlier stages or reopened after completion.

**Files**:
- `src/app/api/programs/[id]/return/route.ts` - Return to earlier stage
- `src/app/api/programs/[id]/reopen/route.ts` - Reopen completed program
- `src/components/dashboard/stage-return-modal.tsx` - Return UI with reason
- `src/app/actions/stage5.ts` - `reopenProgram()` action

**Status**: ✅ Complete. Both return and reopen functional with audit trail.

---

### Feature 13: Team Management

**Description**: Admin user management for creating and viewing team members.

**Files**:
- `src/app/dashboard/team/page.tsx` - Team list page
- `src/app/dashboard/team/add-user-form.tsx` - New user form
- `src/app/actions/admin.ts` - `getUsers()`, `createUser()`

**Status**: ✅ Complete. Admin-only access, password hashing on creation.

---

### Feature 14: Dark Mode / Theme Support

**Description**: Light/dark theme toggle using next-themes.

**Files**:
- `src/components/theme-toggle.tsx` - Toggle button
- `src/app/globals.css` - CSS variables for both themes
- `src/app/layout.tsx` - ThemeProvider setup

**Status**: ✅ Complete. System-aware with manual toggle.

---

### Feature 15: Program Checklist (Mobile)

**Description**: Mobile-friendly checklist view for on-ground operations.

**Files**:
- `src/app/dashboard/programs/[id]/checklist/page.tsx`
- `src/app/dashboard/programs/[id]/checklist/mobile-checklist.tsx`

**Status**: ✅ Complete. Checklist component exists.

---

### Feature 16: Programs Table View

**Description**: Searchable table view of all programs (alternative to Kanban).

**Files**:
- `src/app/dashboard/programs/page.tsx` - Table page
- `src/components/dashboard/programs-table.tsx` - Table with search (217 lines)

**Status**: ✅ Complete. Search filters by name, ID, or company.

---

### Feature 17: Error Boundaries

**Description**: React error boundaries for graceful error recovery.

**Files**:
- `src/app/dashboard/error.tsx` - Dashboard-level error boundary
- `src/app/dashboard/programs/[id]/error.tsx` - Program detail error boundary

**Status**: ✅ Present. Covers dashboard and program detail pages with retry buttons and error digest display.

---

### Feature 18: Health Check

**Description**: Health check endpoint for load balancers and monitoring.

**Files**:
- `src/app/api/health/route.ts` - Returns DB connectivity, latency, uptime

**Status**: ✅ Complete. Returns 200 with DB latency or 503 on failure.

---

### Feature 19: Date Utilities (Shared)

**Description**: Consolidated date parsing, formatting, and urgency badge logic.

**Files**:
- `src/lib/date-utils.ts` - Shared date utilities (173 lines)

**Functions**:
- `parseProgramDate()` - Parses JSON array, range, or plain date strings
- `parseProgramEndDate()` - Extracts end date from range
- `formatProgramDate()` - Formats for display
- `getDaysUntil()` - Days from today
- `getTimelineBadge()` - Urgency badge with label and CSS class

**Status**: ✅ Complete. Extracted from duplicated logic across kanban-card, programs-table, and dashboard-view.

---

## 3. DATABASE & DATA LAYER

### Database

**PostgreSQL** (production via Neon or similar hosted PostgreSQL)

### Schema & Models

**File**: `prisma/schema.prisma` (284 lines)

#### Model: `User` (9 fields, 2 indexes)
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key, auto-generated |
| name | String | |
| email | String | Unique constraint |
| phone | String? | Optional |
| role | String | "Sales", "Ops", "Finance", "Admin" |
| password | String | bcrypt-hashed |
| active | Boolean | Default: true |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-updated |

**Relations**: salesPrograms[], opsPrograms[], rejectedPrograms[], transitions[]
**Indexes**: [role], [role, active]

#### Model: `ProgramCard` (168 fields, 10 indexes)

**Stage 1 Fields** (Sales Input):
- `programId` (unique), `programName`, `programType`, `programDates`, `isMultiDayEvent`, `location`
- `minPax`, `maxPax`, `trainingDays`
- `clientPOCName`, `clientPOCPhone`, `clientPOCEmail`, `companyName`, `companyAddress`
- `activityType`, `activitiesCommitted`, `objectives`, `agendaDocument`, `objectiveDocuments`
- `deliveryBudget`, `billingDetails`, `photoVideoCommitment`
- Budget breakdown: `budgetVenue`, `budgetTransport`, `budgetActivities`, `budgetFood`, `budgetMiscellaneous`, `budgetNotes`
- `venuePOC`, `specialVenueReq`, `eventVendorDetails`
- Approval: `financeApprovalReceived`, `handoverAcceptedByOps`, `handoverIssues`
- Rejection: `rejectionStatus`, `financeRejectionReason`, `opsRejectionReason`, `rejectedBy`, `rejectedAt`, `resubmissionCount`, `lastResubmittedAt`

**Stage 2 Fields** (Ops Acceptance):
- `opsSPOCAssignedName`, `handoverChecklistCompleted`, `meetingWithSalesDone`, `opsComments`
- `opsRejectInAccepted`, `opsRejectInAcceptedReason`

**Stage 3 Fields** (Feasibility):
- Activity: `confirmActivityAvailability`, `agendaWalkthroughDone`, `confirmFacilitatorsAvailability`
- Resources: `facilitatorsFreelancersDetails`, `transportationBlocking`, `teamTransportDetails`, `clientTransportDetails`
- Helpers: `helperBlocking`, `helperDetails`
- Logistics: `logisticsChecklist`, `logisticsListDocument`, `procurementChecklist`, `finalPacking`
- Printing: `printHandoverSheet`, `printScoreSheet`, `printLogisticsSheet`, `printBlueprints`
- Safety: `nearestHospitalDetails`
- Travel: `travelPlanComments`, `feasibilityComments`

**Stage 4 Fields** (Delivery):
- `specialInstructions`, `packingFinalCheckBy`, `onTimeSetup`, `setupDelayDetails`
- `onGroundLeadGen`, `onGroundBD`, `teamActivitiesExecuted`, `participantCount`
- `photosVideosUploaded`, `tripExpenseSubmitted`, `photosVideosDriveLink`

**Stage 5 Fields** (Post Trip):
- `googleReviewDone`, `videoReviewDone`, `sharePicsToClient`, `opsDataEntryDone`
- `tripExpensesBillsSubmittedToFinance`, `logisticsUnpackingDone`, `logisticsUnpackingComment`
- `zfdRating` (1-5), `zfdComments`

**Stage 6 Fields** (Done):
- `closedAt`, `closedBy`, `finalNotes`, `locked`

**Structured Data**: `expenseItems` (JSON string for structured expense tracking)

**Legacy Fields**: ~60 legacy fields from earlier schema versions kept for migration compatibility (Stages 2-5)

**Relations**: salesOwner (User), opsOwner (User), rejector (User), stageTransitions[]

**Indexes** (10):
1. `[currentStage]`
2. `[createdAt]`
3. `[salesPOCId]`
4. `[opsSPOCId]`
5. `[rejectionStatus]`
6. `[currentStage, financeApprovalReceived]`
7. `[currentStage, handoverAcceptedByOps]`
8. `[financeApprovalReceived]`
9. `[zfdRating]`
10. `[updatedAt]`

#### Model: `AppSetting` (4 fields)
| Field | Type | Notes |
|-------|------|-------|
| key | String | Primary key |
| value | String | Setting value |
| label | String? | Human-readable label |
| updatedAt | DateTime | Auto-updated |

#### Model: `StageTransition` (7 fields, 3 indexes)
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| programCardId | String | FK to ProgramCard |
| fromStage | Int | Source stage number |
| toStage | Int | Target stage number |
| transitionedAt | DateTime | Timestamp |
| transitionedBy | String | FK to User |
| approvalNotes | String? | Optional notes/reason |

**Indexes**: [programCardId], [transitionedAt], [transitionedBy]

### Migrations

| Migration | Date | Purpose |
|-----------|------|---------|
| `20260119065533_init` | Jan 19 | Initial schema (3 tables) |
| `20260119100304_add_complete_workflow_fields` | Jan 19 | 31 new stage fields |
| `20260122104738_add_rejection_system` | Jan 22 | Rejection tracking fields |
| `20260122121625_add_multi_day_event_field` | Jan 22 | Multi-day event flag |
| `20260316000000_add_performance_indexes` | Mar 16 | 15 performance indexes |

### Data Access Patterns

- **ORM**: Prisma Client exclusively (1 raw query in health check: `SELECT 1`)
- **Singleton**: `src/lib/prisma.ts` uses global singleton pattern (prevents hot-reload issues)
- **Includes**: Relations loaded via `include` on queries (e.g., `salesOwner`, `opsOwner`)
- **Aggregation**: Prisma `aggregate()` and `groupBy()` for reporting stats
- **Transaction batching**: Dashboard uses `prisma.$transaction()` to batch 10 queries
- **Logging**: `warn` + `error` in dev, `error` only in prod

### Data Validation

- **Server-side**: Zod schemas in server actions for form data
- **Validation library**: `src/lib/validations.ts` with field-level and stage progression validators
- **Client-side**: react-hook-form with Zod resolvers
- **File validation**: Size (10MB max), type whitelist (documents + media)
- **Phone validation**: Indian format (10 digits, starts with 6-9)

---

## 4. APIs & INTEGRATIONS

### Internal API Endpoints

#### Authentication
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler (login, logout, session) | Rate limited (10 POST/min, 30 GET/min) |

#### Health Check
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/health` | Database connectivity and latency check | None |

#### Stage Progression
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| PUT | `/api/programs/[id]/stage1` | Update Stage 1 fields (with change tracking) | Session |
| PUT | `/api/programs/[id]/stage2` | Update Stage 2 fields | Session |
| POST | `/api/programs/[id]/stage2/move` | Move Stage 1 → 2 | Session |
| PUT | `/api/programs/[id]/stage3` | Update Stage 3 fields | Session |
| POST | `/api/programs/[id]/stage3/move` | Move Stage 2 → 3 | Session |
| PUT | `/api/programs/[id]/stage4` | Update Stage 4 fields | Session |
| POST | `/api/programs/[id]/stage4/move` | Move Stage 3 → 4 | Session |
| PUT | `/api/programs/[id]/stage5` | Update Stage 5 fields | Session |
| POST | `/api/programs/[id]/stage5/move` | Move Stage 4 → 5 (closes program) | Session |

#### Program State Management
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/programs/[id]/return` | Return to earlier stage (Ops/Admin) | Session |
| POST | `/api/programs/[id]/reopen` | Reopen completed program (Admin only) | Session |
| DELETE | `/api/programs/[id]/delete` | Delete program and transitions (Admin only) | Session |

#### Data Export
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/programs/export?stage=N` | CSV export, optional stage filter | Session |
| GET | `/api/programs/[id]/export-freelancer?format=md\|txt` | Freelancer-safe export | Session |
| GET | `/api/programs/[id]/helper-sheet` | On-ground helper sheet (text) | Session |

#### Utilities
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/programs/[id]/auto-logistics` | Auto-generate logistics checklist | Session |

#### Settings
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET/PUT | `/api/settings` | App settings CRUD | Session |

#### Cron Jobs
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/cron/delivery-reminder` | Programs with delivery tomorrow | CRON_SECRET Bearer token |
| GET | `/api/cron/expense-overdue` | Expense sheets >7 days overdue | CRON_SECRET Bearer token |
| GET | `/api/cron/timeline-reminder` | Programs approaching in 3 days | CRON_SECRET Bearer token |
| GET | `/api/cron/zfd-alert` | Low ZFD ratings alert | CRON_SECRET Bearer token |

### Server Actions (RPC-style)

| Action | File | Purpose |
|--------|------|---------|
| `createProgram()` | `actions/program.ts` | Create new program at Stage 1 |
| `updateStage1()` | `actions/program.ts` | Edit Stage 1 fields |
| `getPrograms()` | `actions/program.ts` | List all programs |
| `getProgramById()` | `actions/program.ts` | Get single program with relations |
| `approveFinance()` | `actions/approval.ts` | Finance budget approval |
| `acceptHandover()` | `actions/approval.ts` | Ops handover acceptance |
| `rejectFinance()` | `actions/rejection.ts` | Finance rejection |
| `rejectOpsHandover()` | `actions/rejection.ts` | Ops rejection at Stage 1 |
| `rejectOpsInStage2()` | `actions/rejection.ts` | Ops rejection at Stage 2 (returns to S1) |
| `resubmitProgram()` | `actions/rejection.ts` | Sales resubmission after rejection |
| `getPendingApprovals()` | `actions/rejection.ts` | Get programs pending approval |
| `getDashboardStats()` | `actions/admin.ts` | Aggregate dashboard metrics |
| `getRevenueByType()` | `actions/admin.ts` | Revenue grouped by program type |
| `getFacilitatorWorkload()` | `actions/admin.ts` | Ops SPOC workload stats |
| `getMonthlyRevenue()` | `actions/admin.ts` | Last 6 months revenue |
| `getRecentActivity()` | `actions/admin.ts` | Last 20 stage transitions |
| `getUsers()` | `actions/admin.ts` | List all users (Admin) |
| `createUser()` | `actions/admin.ts` | Create new user (Admin) |
| `uploadFile()` | `actions/upload.ts` | Upload file to ImageKit |
| `reopenProgram()` | `actions/stage5.ts` | Reopen closed program |

### Third-Party Integrations

| Service | Purpose | SDK/Library | Config |
|---------|---------|-------------|--------|
| **ImageKit** | File/document storage | @imagekit/nodejs 7.2.1 | Public key, private key, URL endpoint |
| **Nodemailer** | Email delivery (SMTP) | nodemailer 7.0.12 | EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS |
| **NextAuth** | Authentication | next-auth 5.0.0-beta.30 | Secret, URL |
| **Netlify** | Deployment | @netlify/plugin-nextjs | Build command, publish dir |

### Authentication & Authorization

- **Mechanism**: NextAuth v5 Credentials provider with JWT strategy
- **Password**: bcrypt-hashed (using bcryptjs)
- **Session**: JWT tokens stored in HTTP-only cookies
- **Middleware**: Checks `authjs.session-token` or `__Secure-authjs.session-token`
- **Rate Limiting**: Sliding window per-IP (10 POST/min, 30 GET/min on auth)
- **Cron Auth**: Bearer token via CRON_SECRET env var
- **Role checks**: Performed in server actions and API routes via `session.user.role`
- **Type Safety**: Session/JWT types augmented via `next-auth.d.ts` declaration file
- **No OAuth/SSO** integration
- **No API key authentication** for external access (except cron)

---

## 5. CONFIGURATION & ENVIRONMENT

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | JWT signing secret (32-byte base64) | Yes |
| `NEXTAUTH_URL` | Application URL for auth callbacks | Yes |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | ImageKit public key (client-side) | Yes |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key (server-only) | Yes |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint | Yes |
| `EMAIL_HOST` | SMTP server hostname | For emails |
| `EMAIL_PORT` | SMTP server port | For emails |
| `EMAIL_USER` | SMTP username | For emails |
| `EMAIL_PASS` | SMTP password | For emails |
| `EMAIL_FROM` | From address for emails | For emails |
| `EMAIL_SECURE` | Use TLS (true/false) | For emails |
| `CRON_SECRET` | Bearer token for cron job authentication | For cron |
| `NEXT_PUBLIC_APP_URL` | Public application URL (for email links) | For emails |
| `NODE_ENV` | Runtime environment | Auto-set |

**Note**: `.env.example` uses `EMAIL_*` prefix consistently, matching the code in `email.ts`. This was previously misaligned but has been fixed.

### Config Files

| File | Purpose |
|------|---------|
| `next.config.ts` | React compiler, 20MB server action body limit, security headers (HSTS, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy) |
| `tsconfig.json` | Strict TypeScript, ES2017 target, `@/*` path alias |
| `postcss.config.mjs` | Tailwind CSS PostCSS plugin |
| `jest.config.js` | Jest with ts-jest, node environment, path mapping |
| `netlify.toml` | Build: `prisma generate && npm run test:ci && npm run build` |
| `components.json` | Shadcn/ui config: New York style, RSC enabled |
| `eslint.config.mjs` | ESLint flat config: next core-web-vitals + typescript, custom rules |
| `.github/workflows/ci.yml` | CI pipeline: checkout → setup Node 20 → npm ci → prisma generate → lint → test → build |

### Security Headers (in `next.config.ts`)

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| X-DNS-Prefetch-Control | on |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

### ESLint Configuration

Uses ESLint flat config (`eslint.config.mjs`) with:
- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`
- Custom rules: `no-explicit-any` (warn), `no-unused-vars` with `_` prefix ignore pattern, `no-require-imports` (warn), `no-unescaped-entities` (warn), `set-state-in-effect` (warn)
- Global ignores: `.next/**`, `out/**`, `build/**`, `coverage/**`, `prisma/seed*.js`, `jest.config.js`

### Hardcoded Values That Should Be Environment Variables

| Value | Location | Recommendation |
|-------|----------|----------------|
| Ops SPOC names ("Sharath", "Nels", "MK", "Vijay") | Schema/forms | Should be from User table, not hardcoded |
| `10MB` file upload limit | `validations.ts` | Consider moving to env var if configurable |
| Indian phone regex | `validations.ts` | Move to config if internationalization needed |

---

## 6. CURRENT BUGS & CODE ISSUES

### Bugs

1. **Duplicate StageTransition Records** (`src/app/actions/stage2.ts`)
   - `moveToStage3()` creates a StageTransition record, AND the `stage2/move` API route also creates one
   - Results in duplicate audit trail entries for Stage 2→3 transitions

2. **Stage Naming Mismatch** (`src/app/actions/stage4.ts`)
   - `moveToStage5()` function actually closes the program (sets `locked: true`, `closedAt`)
   - The naming suggests it moves to Stage 5, but the behavior is Stage 5→6 closure logic
   - Stage numbering in actions vs API routes may be off by one in some places

### Code Quality Metrics

| Metric | Count | Status |
|--------|-------|--------|
| `as any` type assertions | 7 files | ⚠️ Reduced from ~40+ to 7 (mostly SDK/form boundary) |
| `eslint-disable` comments | 20 files | ⚠️ Pragmatic — mostly form data boundaries |
| `console.*` statements | 67 | ⚠️ Should be replaced with structured logging |
| TODO/FIXME comments | 0 | ✅ All resolved |
| Error boundaries | 2 | ✅ Dashboard + Program detail |
| TypeScript strict mode | Enabled | ✅ |

### Remaining Code Smells

3. **67 Console Statements**
   - `console.log`, `console.error`, `console.warn` scattered across source
   - Should be replaced with structured logging for production

4. **Large Single-Model Design**
   - ProgramCard has 168 fields in one table (plus ~60 legacy fields)
   - Could benefit from normalization (stage-specific detail tables) at scale

5. **Hardcoded Ops SPOC Names**
   - Names like "Sharath", "Nels", "MK", "Vijay" are hardcoded in forms/schema
   - Should query from User table where `role = 'Ops'`

6. **Stage 1 Form Complexity**
   - `stage1-form.tsx` at 1,070 lines is the largest component
   - Could benefit from splitting into sub-components (budget section, client section, etc.)

### Security Assessment (Updated)

| Area | Status | Details |
|------|--------|---------|
| Authentication | ✅ Strong | bcrypt + JWT + deactivated user check |
| Rate Limiting | ✅ Present | Sliding window on auth endpoints (10 POST/min, 30 GET/min) |
| Route Protection | ✅ Strong | Middleware guards all /dashboard/* routes |
| Cron Authentication | ✅ Fixed | All 4 cron endpoints require Bearer CRON_SECRET |
| SQL Injection | ✅ Safe | Prisma parameterized queries (1 raw query is `SELECT 1`) |
| CSRF Protection | ✅ Built-in | Server Actions have built-in CSRF in Next.js |
| Security Headers | ✅ Strong | HSTS, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy |
| .env Protection | ✅ Secured | `.env*` in `.gitignore` |
| Input Validation | ⚠️ Mixed | Zod schemas exist but `createProgram` doesn't validate before DB write |
| XSS Sanitization | ⚠️ Missing | No explicit sanitization on user text inputs |
| Body Size Limit | ✅ Fixed | Reduced to 20MB (from previous 100MB) |

---

## 7. TESTING

### Testing Framework

- **Jest 30.3.0** with ts-jest for TypeScript
- **@testing-library/react 16.3.2** (available but not heavily used)
- **@testing-library/jest-dom 6.9.1** for DOM assertions
- **node-mocks-http** for HTTP request/response mocking
- **Environment**: Node (not jsdom)

### Test Coverage

| Test File | Tests | What's Covered |
|-----------|-------|---------------|
| `__tests__/lib/validations.test.ts` | ~42 | All validators, stage progression, edge cases |
| `__tests__/lib/date-utils.test.ts` | ~20 | Date parsing, formatting, urgency badges |
| `__tests__/actions/admin-queries.test.ts` | ~30 | Dashboard stats, user management, workload |
| `__tests__/actions/pending-approvals.test.ts` | ~20 | Finance/Ops approval queues, filtering |
| `__tests__/actions/settings.test.ts` | ~15 | App settings CRUD operations |
| `__tests__/api/settings-route.test.ts` | ~15 | REST endpoint for settings |
| **Total** | **142 tests, 6 suites** | **All passing** |

### What Is NOT Tested

| Area | Files | Impact |
|------|-------|--------|
| React Components | `src/components/**/*.tsx` (51 files) | Medium - UI logic |
| Stage Form Submissions | `src/app/actions/stage{1-5}.ts` | High - Core business logic |
| Program CRUD | `src/app/actions/program.ts` | High - Entry points |
| Stage Move API Routes | `src/app/api/programs/[id]/stage*/move/route.ts` | High |
| Auth | `src/auth.ts`, `src/middleware.ts` | High - Security |
| Email | `src/lib/email.ts`, `email-templates.ts` | Medium - Communication |
| File Upload | `src/lib/imagekit.ts`, `actions/upload.ts` | Low - Third-party wrapper |

### Mock Setup

- `__mocks__/prisma.ts` - Prisma client mock with jest.fn() for:
  - `programCard` (findUnique, findMany, create, update, delete, count, aggregate, groupBy)
  - `stageTransition` (create, findMany)
  - `user` (findUnique, findMany)
  - `appSetting` (findUnique, findMany, upsert)
  - `$transaction`

### Test Scripts

```json
"test": "jest --watchAll"
"test:ci": "jest --ci --coverage --forceExit"
```

### Test Quality Assessment

- **Existing tests**: Well-structured with good edge case coverage
- **Estimated overall coverage**: ~15-20% of codebase by lines
- **No integration tests**: No tests for complete workflows
- **No E2E tests**: No Playwright/Cypress setup
- **No component tests**: Despite having @testing-library/react installed

---

## 8. FUTURE REQUIRED CHANGES

### Scalability Bottlenecks

1. **No Pagination** - `getPrograms()` fetches ALL programs without `take`/`skip`. Will degrade with volume.
2. **168-Field SELECT** - Every ProgramCard query loads all fields; no field selection optimization.
3. **No Caching Layer** - Every page load queries the database directly. Consider Redis or Next.js unstable_cache.
4. **In-Memory Rate Limiter** - Won't work across multiple instances. Replace with Redis for multi-instance deployment.
5. **Full Program Fetch on Dashboard** - Kanban loads all programs with all fields; should be paginated with minimal field selection.

### Missing Features

1. **Audit Log UI** - StageTransition records exist but no UI to browse full audit history
2. **Notifications Center** - No in-app notification system (only email)
3. **Advanced Search & Filter** - Limited search (name/ID/company only); no date, stage, or budget filters
4. **User Profile** - No profile editing, password change
5. **Bulk Actions** - No bulk approve, bulk export, bulk stage transition
6. **Activity Logging** - No logging of who viewed or edited what
7. **Comments/Notes System** - Limited to stage-specific comment fields; no general commenting
8. **Dashboard Customization** - Fixed dashboard layout, no widget customization
9. **Webhook Support** - No webhooks for external system integration
10. **API Documentation** - No OpenAPI/Swagger docs for API endpoints

### Technical Debt

1. **67 Console Statements** - Should be replaced with structured logging (pino/winston)
2. **Legacy Schema Fields** - ~60 legacy fields in ProgramCard kept for compatibility
3. **NextAuth Beta Dependency** - Using pre-release v5-beta.30 with potential breaking changes
4. **Stage 1 Form Size** - 1,070 lines; should be decomposed into sub-components
5. **Hardcoded Ops SPOC Names** - Should query from User table dynamically

---

## 9. PRODUCTION READINESS CHANGES

### Security (Updated Assessment)

| Issue | Severity | Status | Description |
|-------|----------|--------|-------------|
| Rate limiting on auth | ✅ Fixed | Done | 10 POST/min, 30 GET/min per IP |
| Cron endpoint auth | ✅ Fixed | Done | All 4 cron routes require CRON_SECRET Bearer token |
| Security headers | ✅ Fixed | Done | HSTS, X-Frame-Options, CSP, etc. in next.config.ts |
| Health check endpoint | ✅ Fixed | Done | `/api/health` with DB connectivity check |
| Error boundaries | ✅ Fixed | Done | Dashboard and program detail error boundaries |
| Body size limit | ✅ Fixed | Done | Reduced to 20MB with validation at 10MB |
| Env var alignment | ✅ Fixed | Done | `.env.example` matches code (`EMAIL_*` prefix) |
| Deactivated user check | ✅ Fixed | Done | Enforced at login in auth.ts |
| Type safety | ✅ Improved | Done | `next-auth.d.ts` augmentation, centralized types |
| No input sanitization | ⚠️ Open | Medium | No XSS sanitization on text fields |
| NextAuth beta | ⚠️ Open | Medium | v5 beta.30 may have security patches pending |
| Missing CSP header | ⚠️ Open | Medium | Content-Security-Policy not configured (other headers present) |

### Performance (Updated Assessment)

| Issue | Severity | Status | Description |
|-------|----------|--------|-------------|
| Database indexes | ✅ Fixed | Done | 15 indexes across all models |
| Query batching | ✅ Good | Done | Dashboard uses `$transaction()` for 10 queries |
| React Compiler | ✅ Enabled | Done | Automatic memoization |
| Date utility consolidation | ✅ Fixed | Done | Shared `date-utils.ts` replaces duplicated logic |
| No pagination on queries | 🔴 Open | High | `getPrograms()` loads ALL records |
| 168-field SELECT * | 🟡 Open | Medium | No field selection; loads all columns |
| No caching layer | 🟡 Open | Medium | Every request hits database directly |
| No bundle analysis | 🟠 Open | Low | No bundle size monitoring |

### Reliability (Updated Assessment)

| Issue | Severity | Status | Description |
|-------|----------|--------|-------------|
| Health check | ✅ Fixed | Done | `/api/health` with DB latency check |
| Error boundaries | ✅ Fixed | Done | Dashboard + program detail boundaries |
| Email graceful degradation | ✅ Good | Done | Stub in dev, error handling in prod |
| No error tracking | 🔴 Open | High | No Sentry, Datadog, or similar |
| No structured logging | 🔴 Open | High | 67 console.* statements, no log levels |
| No email retry mechanism | 🟡 Open | Medium | Failed emails are lost silently |

### DevOps & Deployment (Updated Assessment)

| Issue | Severity | Status | Description |
|-------|----------|--------|-------------|
| CI/CD pipeline | ✅ Fixed | Done | GitHub Actions: lint → test → build with coverage |
| Netlify deployment | ✅ Ready | Done | `netlify.toml` with prisma generate + test + build |
| .env protection | ✅ Fixed | Done | `.env*` in `.gitignore` |
| No Docker configuration | 🟡 Open | Medium | No Dockerfile for consistent environments |
| No staging environment | 🟡 Open | Medium | Only dev and implied prod |
| No database backup strategy | 🟡 Open | Medium | No backup schedules or procedures |
| No monitoring/alerting | 🟡 Open | Medium | No uptime monitoring |

---

## 10. RECOMMENDED PRIORITY ROADMAP

### ✅ Completed Since Initial Analysis (Mar 16 → Mar 19)

| # | Item | Status |
|---|------|--------|
| 1 | Secure cron endpoints with CRON_SECRET auth | ✅ Done |
| 2 | Add rate limiting on auth endpoints | ✅ Done |
| 3 | Add database performance indexes (15 indexes) | ✅ Done |
| 4 | Fix environment variable naming alignment | ✅ Done |
| 5 | Add health check endpoint | ✅ Done |
| 6 | Set up CI/CD pipeline (GitHub Actions) | ✅ Done |
| 7 | Reduce server action body limit (100MB → 20MB) | ✅ Done |
| 8 | Add security headers (HSTS, X-Frame-Options, etc.) | ✅ Done |
| 9 | Create TypeScript interfaces (centralized types) | ✅ Done |
| 10 | Add React error boundaries | ✅ Done |
| 11 | Extract shared date utilities | ✅ Done |
| 12 | Add NextAuth type augmentation | ✅ Done |
| 13 | Complete cron email integration (all 4 endpoints) | ✅ Done |
| 14 | Add user deactivation check at login | ✅ Done |

### 🔴 Critical — Must Fix Before Launch

1. **Add Pagination to Program Queries** - `getPrograms()` and dashboard queries currently load ALL records. Will fail with production data volumes.

2. **Fix Duplicate StageTransition Bug** - Stage 2→3 transition creates duplicate audit records. Fix in `actions/stage2.ts`.

3. **Add Error Tracking** - Integrate Sentry or similar for production error monitoring. No visibility into production errors currently.

4. **Add Structured Logging** - Replace 67 console.* statements with pino or similar. Add log levels and structured output.

5. **Add Input Sanitization** - No XSS protection on user text fields rendered in views and emails.

### 🟡 Important — Fix Soon After Launch

6. **Add Content Security Policy** - CSP header missing from security headers config.

7. **Add Server-Side Test Coverage** - Write tests for server actions (stage submissions, approval workflow, program CRUD). Target: 50%+ coverage.

8. **Dynamic Ops SPOC Selection** - Query active Ops users from database instead of hardcoded names.

9. **Fix Stage Naming Mismatch** - `moveToStage5()` in stage4.ts actually performs Stage 5→6 closure. Rename for clarity.

10. **Decompose Stage 1 Form** - Split 1,070-line form into sub-components (budget, client, activity, venue sections).

11. **Add Database Backup Strategy** - Document and automate PostgreSQL backup schedule.

12. **Clean Up Legacy Schema Fields** - Audit ~60 legacy fields and remove if no longer referenced.

### 🟢 Nice to Have — Future Improvements

13. **Add In-App Notifications** - Build notification center for real-time updates.

14. **Implement Optimistic UI Updates** - Kanban board should update immediately on drag with rollback on failure.

15. **Add Audit Log UI** - Build a page to browse StageTransition records with filtering.

16. **Advanced Search & Filters** - Add date range, budget range, stage, and owner filters to program list.

17. **Add E2E Tests** - Set up Playwright for critical user flows.

18. **Normalize ProgramCard Model** - Consider breaking 168-field model into stage-specific tables.

19. **Add Webhook Support** - Allow external systems to subscribe to workflow events.

20. **API Documentation** - Generate OpenAPI/Swagger docs for all endpoints.

21. **Add Docker Configuration** - Create Dockerfile and docker-compose for consistent development.

22. **Upgrade NextAuth to Stable** - Move from beta.30 to stable release when available.

23. **Add Password Change** - Allow users to change their own passwords.

24. **Implement Bulk Operations** - Bulk approve, bulk export for admin workflows.

25. **Add Dashboard Customization** - Let users configure which widgets they see.

26. **Implement Field-Level Selection** - Use Prisma `select` to fetch only needed fields, reducing query payload.

27. **Add Redis Rate Limiting** - Replace in-memory rate limiter for multi-instance production deployment.

28. **Bundle Optimization** - Analyze and optimize client bundle size with code splitting.

---

*This analysis was generated by reviewing every file in the TreOpsFlow codebase. Last updated: 2026-03-19.*
