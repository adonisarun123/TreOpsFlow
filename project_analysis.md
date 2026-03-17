# TreOpsFlow - Comprehensive Project Analysis

**Generated**: 2026-03-16
**Project**: TreOpsFlow (trebound-workflow)
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
| **Language** | TypeScript 5.9.3 |
| **UI Library** | React 19.2.3 |
| **Styling** | Tailwind CSS 4, Shadcn/ui (New York style), Lucide icons |
| **Forms** | react-hook-form 7.70.0, @hookform/resolvers 5.2.2, Zod 4.3.5 |
| **Database** | PostgreSQL via Prisma ORM 6.19.1 |
| **Authentication** | NextAuth v5 (beta.30) with Credentials provider |
| **Drag & Drop** | @dnd-kit/core 6.3.1 |
| **Charts** | Recharts 3.8.0 |
| **Email** | Nodemailer 7.0.12 |
| **File Storage** | ImageKit (@imagekit/nodejs 7.2.1) |
| **Date Utilities** | date-fns 4.1.0 |
| **Password Hashing** | bcryptjs 3.0.3 |
| **Theming** | next-themes 0.4.6 |
| **Testing** | Jest 30.3.0, @testing-library/react 16.3.2, ts-jest 29.4.6 |
| **Deployment** | Netlify (@netlify/plugin-nextjs 5.15.7) |
| **Package Manager** | npm |

### Architecture

**Monolithic Next.js Application** using the App Router pattern:
- **Server Components** for data fetching (pages, layouts)
- **Client Components** for interactivity (forms, kanban board, modals)
- **Server Actions** for mutations (form submissions, stage transitions)
- **API Routes** for RESTful endpoints (exports, cron jobs, stage moves)
- **Middleware** for authentication guards

### Directory Structure

```
TreOpsFlow/
├── prisma/                          # Database layer
│   ├── schema.prisma                # Data model (3 models, 240+ fields)
│   ├── migrations/                  # 4 SQL migrations
│   ├── seed.ts                      # Default user seeding
│   └── dev.db                       # SQLite dev database
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout (fonts, theme, toaster)
│   │   ├── page.tsx                 # Root redirect (auth check)
│   │   ├── globals.css              # Tailwind + custom stage colors
│   │   ├── login/page.tsx           # Login page
│   │   ├── actions/                 # Server Actions (10 files, ~1,700 lines)
│   │   ├── api/                     # API Routes
│   │   │   ├── auth/                # NextAuth handlers
│   │   │   ├── cron/                # 4 scheduled job endpoints
│   │   │   └── programs/            # Program CRUD & stage endpoints
│   │   └── dashboard/               # Protected dashboard pages
│   │       ├── layout.tsx           # Auth guard + shell wrapper
│   │       ├── page.tsx             # Kanban board view
│   │       ├── programs/            # Program list + detail pages
│   │       ├── pending-approvals/   # Approval queue
│   │       ├── reports/             # Analytics dashboard
│   │       ├── settings/            # User settings
│   │       └── team/               # User management (Admin)
│   ├── components/
│   │   ├── dashboard/               # 13 dashboard components
│   │   ├── forms/                   # 11 stage-specific forms
│   │   ├── ui/                      # 20+ Shadcn/ui components
│   │   └── *.tsx                    # Feature components (5 files)
│   ├── lib/                         # Shared utilities
│   │   ├── prisma.ts                # DB client singleton
│   │   ├── validations.ts           # Stage progression rules
│   │   ├── email.ts                 # Email sender (stubbed in dev)
│   │   ├── email-templates.ts       # 11 HTML email templates
│   │   ├── imagekit.ts              # File upload service
│   │   └── utils.ts                 # cn() class utility
│   ├── auth.ts                      # NextAuth configuration
│   └── middleware.ts                # Route protection
├── __tests__/                       # Test suite
├── __mocks__/                       # Prisma mocks
├── package.json                     # Dependencies & scripts
├── next.config.ts                   # Next.js config
├── tsconfig.json                    # TypeScript config
├── jest.config.js                   # Test config
└── netlify.toml                     # Deployment config
```

### Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| Application root | `src/app/layout.tsx` | Root layout, font loading, theme provider |
| Home page | `src/app/page.tsx` | Auth-based redirect to `/dashboard` or `/login` |
| Auth config | `src/auth.ts` | NextAuth v5 credentials provider setup |
| Middleware | `src/middleware.ts` | Route protection, redirect logic |
| DB client | `src/lib/prisma.ts` | Prisma singleton for database access |

---

## 2. COMPLETE FEATURE DOCUMENTATION

### Feature 1: User Authentication & Authorization

**Description**: Credential-based authentication with role-based access control (RBAC) for 4 user roles: Sales, Ops, Finance, Admin.

**Files**:
- `src/auth.ts` - NextAuth v5 configuration with Credentials provider
- `src/middleware.ts` - Route protection middleware
- `src/app/login/page.tsx` - Login page with branded split layout
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API handler

**How It Works**:
1. User submits email/password on login page
2. NextAuth Credentials provider queries Prisma for user by email
3. bcryptjs compares password hash
4. JWT token created with user `id`, `role`, `name`, `email`
5. Session callbacks attach role/id to session object
6. Middleware checks `authjs.session-token` or `__Secure-authjs.session-token` cookie
7. Protected routes under `/dashboard/*` redirect to `/login` if unauthenticated

**Routes**: `POST /api/auth/callback/credentials`, `GET /api/auth/session`

**Dependencies**: next-auth v5-beta.30, bcryptjs, Prisma

**Status**: Complete. Working but uses NextAuth beta version.

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
- `src/lib/validations.ts` - Stage progression validators
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

**Status**: Complete. Core workflow is functional.

---

### Feature 3: Kanban Board

**Description**: Visual drag-and-drop board showing programs across 6 stage columns.

**Files**:
- `src/components/dashboard/kanban-board.tsx` - Main board with DnD context
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

**Status**: Complete. No optimistic UI updates; relies on page refresh after transitions.

---

### Feature 4: Finance & Ops Approval Workflow

**Description**: Dual-track approval system where Finance and Ops review programs simultaneously at Stage 1.

**Files**:
- `src/app/actions/approval.ts` - `approveFinance()`, `acceptHandover()`
- `src/app/actions/rejection.ts` - `rejectFinance()`, `rejectOpsHandover()`, `resubmitProgram()`
- `src/components/handover-actions.tsx` - Approval/rejection UI
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

**Status**: Complete. Simultaneous review model working.

---

### Feature 5: Program Detail Page & Stage Forms

**Description**: Full program management page with stage-specific forms.

**Files**:
- `src/app/dashboard/programs/[id]/page.tsx` - Program detail page
- `src/components/forms/stage1-form.tsx` - Tentative handover form (most complex)
- `src/components/forms/stage2-accepted-form.tsx` - Ops acceptance form
- `src/components/forms/stage3-feasibility-form.tsx` - Prep checklist
- `src/components/forms/stage4-delivery-form.tsx` - Execution data
- `src/components/forms/stage5-posttrip-form.tsx` - Closure checklist
- `src/components/forms/stage6-done-view.tsx` - Archived view
- `src/components/dashboard/stage1-summary.tsx` - Read-only Stage 1 summary
- `src/components/dashboard/stage-stepper.tsx` - Visual stage progress

**How It Works**:
1. Page fetches program by ID with sales/ops owner relations
2. Shows rejection feedback if program is rejected
3. Shows HandoverActions for Finance/Ops at Stage 1
4. Renders appropriate form based on `currentStage`
5. Forms validate with Zod schemas and submit via Server Actions
6. Each form has save (partial) and move-to-next-stage (validates exit criteria) options

**Status**: Complete. Forms are functional but Stage 1 form is very long.

---

### Feature 6: Reporting & Analytics Dashboard

**Description**: Analytics page with charts showing program statistics, revenue, and team workload.

**Files**:
- `src/app/dashboard/reports/page.tsx` - Reports page
- `src/components/dashboard/reports-charts.tsx` - Charts and KPI cards
- `src/app/actions/admin.ts` - `getDashboardStats()`, `getRevenueByType()`, `getFacilitatorWorkload()`, `getMonthlyRevenue()`, `getRecentActivity()`, `getTransportReport()`

**How It Works**:
1. Server component fetches multiple aggregate queries
2. Displays: 4 KPI cards, 6-month revenue trend (area chart), stage distribution (pie chart), revenue by type (bar chart), facilitator workload, recent activity feed, transport tracking
3. Currency formatting uses Indian notation (Cr, L, K)

**Dependencies**: Recharts, Prisma aggregations

**Status**: Complete. Data is real-time from database.

---

### Feature 7: Email Notification System

**Description**: Automated email notifications for workflow events.

**Files**:
- `src/lib/email.ts` - Email transport (nodemailer)
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

**Status**: Partial. Templates exist but email sending is **stubbed in development** (console.log only). Production uses nodemailer but requires SMTP configuration.

---

### Feature 8: File Upload System

**Description**: Document and media uploads via ImageKit cloud storage.

**Files**:
- `src/lib/imagekit.ts` - ImageKit SDK integration
- `src/app/actions/upload.ts` - Upload server action
- `src/components/ui/file-upload.tsx` - Drag-and-drop upload UI

**How It Works**:
1. Client selects file via file-upload component
2. Server action validates file size (10MB max) and type
3. File converted to base64 and uploaded to ImageKit
4. Returns URL and file ID for storage in program fields
5. Supports documents (PDF, DOC, DOCX, XLS, XLSX) and media (JPG, PNG, MP4, MOV, etc.)

**Status**: Complete. Working with ImageKit.

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

**Status**: Complete. All exports working.

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

**Status**: Complete. Logic-based generation, no AI.

---

### Feature 11: Cron Jobs (Scheduled Reminders)

**Description**: 4 scheduled endpoints for automated alerts.

**Files**:
- `src/app/api/cron/delivery-reminder/route.ts` - Programs with delivery tomorrow
- `src/app/api/cron/expense-overdue/route.ts` - Expense sheets overdue (>7 days)
- `src/app/api/cron/timeline-reminder/route.ts` - Programs approaching within 3 days
- `src/app/api/cron/zfd-alert/route.ts` - Low ZFD ratings (<=3) in last 7 days

**Status**: Partial. Query logic works but **email sending is not integrated** (TODO comments). Only `zfd-alert` has email integration.

---

### Feature 12: Program Return & Reopen

**Description**: Programs can be returned to earlier stages or reopened after completion.

**Files**:
- `src/app/api/programs/[id]/return/route.ts` - Return to earlier stage
- `src/app/api/programs/[id]/reopen/route.ts` - Reopen completed program
- `src/components/dashboard/stage-return-modal.tsx` - Return UI with reason
- `src/app/actions/stage5.ts` - `reopenProgram()` action

**Status**: Complete. Both return and reopen functional with audit trail.

---

### Feature 13: Team Management

**Description**: Admin user management for creating and viewing team members.

**Files**:
- `src/app/dashboard/team/page.tsx` - Team list page
- `src/app/dashboard/team/add-user-form.tsx` - New user form
- `src/app/actions/admin.ts` - `getUsers()`, `createUser()`

**Status**: Complete. Admin-only access, password hashing on creation.

---

### Feature 14: Dark Mode / Theme Support

**Description**: Light/dark theme toggle using next-themes.

**Files**:
- `src/components/theme-toggle.tsx` - Toggle button
- `src/app/globals.css` - CSS variables for both themes
- `src/app/layout.tsx` - ThemeProvider setup

**Status**: Complete. System-aware with manual toggle.

---

### Feature 15: Program Checklist (Mobile)

**Description**: Mobile-friendly checklist view for on-ground operations.

**Files**:
- `src/app/dashboard/programs/[id]/checklist/page.tsx`
- `src/app/dashboard/programs/[id]/checklist/mobile-checklist.tsx`

**Status**: Present. Checklist component exists.

---

### Feature 16: Programs Table View

**Description**: Searchable table view of all programs (alternative to Kanban).

**Files**:
- `src/app/dashboard/programs/page.tsx` - Table page
- `src/components/dashboard/programs-table.tsx` - Table with search

**Status**: Complete. Search filters by name, ID, or company.

---

## 3. DATABASE & DATA LAYER

### Database

**PostgreSQL** (production) / **SQLite** (development - `prisma/dev.db`)

### Schema & Models

#### Model: `User`
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

#### Model: `ProgramCard` (~240 fields)

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

**Relations**: salesOwner (User), opsOwner (User), rejector (User), stageTransitions[]

#### Model: `StageTransition`
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| programCardId | String | FK to ProgramCard |
| fromStage | Int | Source stage number |
| toStage | Int | Target stage number |
| transitionedAt | DateTime | Timestamp |
| transitionedBy | String | FK to User |
| approvalNotes | String? | Optional notes/reason |

### Migrations

| Migration | Date | Purpose |
|-----------|------|---------|
| `20260119065533_init` | Jan 19 | Initial schema (3 tables) |
| `20260119100304_add_complete_workflow_fields` | Jan 19 | 31 new stage fields |
| `20260122104738_add_rejection_system` | Jan 22 | Rejection tracking fields |
| `20260122121625_add_multi_day_event_field` | Jan 22 | Multi-day event flag |

### Data Access Patterns

- **ORM**: Prisma Client exclusively (no raw queries)
- **Singleton**: `src/lib/prisma.ts` uses global singleton pattern (prevents hot-reload issues)
- **Includes**: Relations loaded via `include` on queries (e.g., `salesOwner`, `opsOwner`)
- **Aggregation**: Prisma `aggregate()` and `groupBy()` for reporting stats

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
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler (login, logout, session) |

#### Stage Progression
| Method | Path | Purpose |
|--------|------|---------|
| PUT | `/api/programs/[id]/stage1` | Update Stage 1 fields (with change tracking) |
| POST | `/api/programs/[id]/stage2/move` | Move Stage 1 -> 2 |
| PUT | `/api/programs/[id]/stage2` | Update Stage 2 fields |
| POST | `/api/programs/[id]/stage3/move` | Move Stage 2 -> 3 |
| PUT | `/api/programs/[id]/stage3` | Update Stage 3 fields |
| POST | `/api/programs/[id]/stage4/move` | Move Stage 3 -> 4 |
| PUT | `/api/programs/[id]/stage4` | Update Stage 4 fields |
| POST | `/api/programs/[id]/stage5/move` | Move Stage 4 -> 5 (closes program) |

#### Program State Management
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/programs/[id]/return` | Return to earlier stage (Ops/Admin) |
| POST | `/api/programs/[id]/reopen` | Reopen completed program (Admin only) |
| DELETE | `/api/programs/[id]/delete` | Delete program and transitions (Admin only) |

#### Data Export
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/programs/export?stage=N` | CSV export, optional stage filter |
| GET | `/api/programs/[id]/export-freelancer?format=md\|txt` | Freelancer-safe export |
| GET | `/api/programs/[id]/helper-sheet` | On-ground helper sheet (text) |

#### Utilities
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/programs/[id]/auto-logistics` | Auto-generate logistics checklist |

#### Cron Jobs
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/cron/delivery-reminder` | Programs with delivery tomorrow |
| GET | `/api/cron/expense-overdue` | Expense sheets >7 days overdue |
| GET | `/api/cron/timeline-reminder` | Programs approaching in 3 days |
| GET | `/api/cron/zfd-alert` | Low ZFD ratings alert |

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
| **Nodemailer** | Email delivery (SMTP) | nodemailer 7.0.12 | SMTP host, port, user, password |
| **NextAuth** | Authentication | next-auth 5.0.0-beta.30 | Secret, URL |
| **Netlify** | Deployment | @netlify/plugin-nextjs | Build command, publish dir |

### Authentication & Authorization

- **Mechanism**: NextAuth v5 Credentials provider with JWT strategy
- **Password**: bcrypt-hashed (cost factor 10)
- **Session**: JWT tokens stored in HTTP-only cookies
- **Middleware**: Checks `authjs.session-token` or `__Secure-authjs.session-token`
- **Role checks**: Performed in server actions and API routes via `session.user.role`
- **No API key authentication** for external access
- **No OAuth/SSO** integration

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
| `SMTP_HOST` / `EMAIL_HOST` | SMTP server hostname | For emails |
| `SMTP_PORT` / `EMAIL_PORT` | SMTP server port | For emails |
| `SMTP_USER` / `EMAIL_USER` | SMTP username | For emails |
| `SMTP_PASSWORD` / `EMAIL_PASS` | SMTP password | For emails |
| `SMTP_FROM` / `EMAIL_FROM` | From address for emails | For emails |
| `EMAIL_SECURE` | Use TLS (true/false) | For emails |
| `NEXT_PUBLIC_APP_URL` | Public application URL | For email links |
| `NODE_ENV` | Runtime environment | Auto-set |

**Note**: Email env vars have inconsistent naming (`SMTP_*` in .env.example vs `EMAIL_*` in code). The code in `email.ts` uses `EMAIL_*` prefix.

### Config Files

| File | Purpose |
|------|---------|
| `next.config.ts` | React compiler enabled, server actions body size limit (100MB) |
| `tsconfig.json` | Strict TypeScript, ES2017 target, `@/*` path alias |
| `postcss.config.mjs` | Tailwind CSS PostCSS plugin |
| `jest.config.js` | Jest with ts-jest, node environment, path mapping |
| `netlify.toml` | Netlify build: `prisma generate && npm run build` |
| `components.json` | Shadcn/ui config: New York style, RSC enabled |
| `eslint.config.mjs` | Next.js core-web-vitals + TypeScript rules |
| `prisma.config.ts` | Prisma schema path, classic engine |

### Hardcoded Values That Should Be Environment Variables

| Value | Location | Recommendation |
|-------|----------|----------------|
| `http://localhost:3000` | `email-templates.ts:3` | Already uses `NEXT_PUBLIC_APP_URL` with fallback - OK |
| `100mb` body size limit | `next.config.ts` | Consider making configurable |
| `10MB` file upload limit | `validations.ts` | Move to env var |
| Indian phone regex | `validations.ts` | Move to config if internationalization needed |
| Ops SPOC names ("Sharath", "Nels", "MK", "Vijay") | Schema/forms | Should be from User table, not hardcoded |
| `password123`, `arun4321` | `seed.ts` | Development only - acceptable, but warn in docs |

---

## 6. CURRENT BUGS & CODE ISSUES

### Bugs

1. **Duplicate StageTransition Records** (`src/app/actions/stage2.ts`)
   - `moveToStage3()` creates a StageTransition record, AND the `stage2/move` API route also creates one
   - Results in duplicate audit trail entries for Stage 2->3 transitions

2. **Stage Naming Mismatch** (`src/app/actions/stage4.ts`)
   - `moveToStage5()` function actually closes the program (sets `locked: true`, `closedAt`)
   - The naming suggests it moves to Stage 5, but the behavior is Stage 5->6 closure logic
   - Stage numbering in actions vs API routes may be off by one in some places

3. **Email Environment Variable Mismatch**
   - `.env.example` uses `SMTP_*` prefix (SMTP_HOST, SMTP_PORT, etc.)
   - `src/lib/email.ts` code uses `EMAIL_*` prefix (EMAIL_HOST, EMAIL_PORT, etc.)
   - Users following .env.example will have non-functional email

4. **Cron Endpoints Have No Authentication**
   - All 4 cron routes (`/api/cron/*`) have no authentication checks
   - Anyone can trigger delivery reminders, expense alerts, etc.
   - Should use a cron secret or API key

### Code Smells & Anti-Patterns

5. **Pervasive `any` Type Usage**
   - All stage validators use `program: any` parameter
   - Auth callbacks use `(user as any)`, `(session.user as any)`
   - ImageKit uses `(ImageKit as any)` type assertion
   - Component props extensively use `program: any`
   - **Impact**: No compile-time safety for the primary data model

6. **Date Parsing Logic Duplication**
   - Same date parsing and urgency badge logic appears in:
     - `dashboard-view.tsx`
     - `kanban-card.tsx`
     - `programs-table.tsx`
   - Should be extracted to a shared utility

7. **Large Single-Model Design**
   - ProgramCard has ~240 fields in one table
   - Could benefit from normalization (stage-specific detail tables)
   - Makes queries slow as project scales

8. **70+ Console Statements**
   - `console.log`, `console.error`, `console.warn` scattered across source
   - Should be removed or replaced with structured logging for production

9. **Legacy/Dead Code**
   - `stage2-form.tsx` and `stage3-form.tsx` appear to be older versions
   - `stage5-view.tsx` exists alongside `stage5-posttrip-form.tsx`
   - `program-form.tsx` alongside `stage1-form.tsx`
   - These should be audited and removed if unused

10. **Hardcoded Ops SPOC Names**
    - Names like "Sharath", "Nels", "MK", "Vijay" are hardcoded in forms/schema
    - Should query from User table where `role = 'Ops'`

### Missing Error Handling

11. **Generic Error Toasts**
    - Most API calls show generic "Something went wrong" errors
    - Specific validation errors from server are not displayed to user

12. **No Error Boundaries**
    - No React error boundaries for component-level error recovery
    - A single component crash could bring down the entire page

13. **Email Failures Silent**
    - Email send failures are logged but not surfaced to users
    - No retry mechanism for failed emails

### Security Concerns

14. **No CSRF Protection on Cron Routes**
    - Cron endpoints are publicly accessible GET routes
    - Could be triggered by any crawler or malicious request

15. **No Rate Limiting**
    - No rate limiting on login endpoint
    - No rate limiting on API endpoints
    - Brute force attacks possible

16. **Server Actions Body Size**
    - `next.config.ts` sets body size limit to `100mb`
    - Excessively large for most operations, potential DoS vector

---

## 7. TESTING

### Testing Framework

- **Jest 30.3.0** with ts-jest for TypeScript
- **@testing-library/react 16.3.2** (available but not heavily used)
- **@testing-library/jest-dom 6.9.1** for DOM assertions
- **node-mocks-http** for HTTP request/response mocking
- **Environment**: Node (not jsdom)

### Test Coverage

#### What Is Tested

| File | Tests | Coverage |
|------|-------|---------|
| `src/lib/validations.ts` | 30+ test cases | ~100% of validation functions |

**Covered areas**:
- All utility validators (email, phone, dates, budget, files, ZFD)
- All 5 stage progression validators (exit criteria for each stage)
- Stage 1 field validation
- Edge cases (empty strings, boundary values, null/undefined)

#### What Is NOT Tested

| Area | Files | Impact |
|------|-------|--------|
| Server Actions | `src/app/actions/*.ts` (10 files) | High - Core business logic |
| API Routes | `src/app/api/**/*.ts` (20+ files) | High - Entry points |
| Components | `src/components/**/*.tsx` (30+ files) | Medium - UI logic |
| Auth | `src/auth.ts`, `src/middleware.ts` | High - Security |
| Email | `src/lib/email.ts`, `email-templates.ts` | Medium - Communication |
| ImageKit | `src/lib/imagekit.ts` | Low - Third-party wrapper |

### Mock Setup

- `__mocks__/prisma.ts` - Prisma client mock with jest.fn() for:
  - `programCard` (findUnique, findMany, create, update, delete, count, aggregate)
  - `stageTransition` (create, findMany)
  - `user` (findUnique, findMany)

### Test Scripts

```json
"test": "jest --watchAll"
"test:ci": "jest --ci --coverage --forceExit"
```

### Test Quality Assessment

- **Existing tests**: Well-structured with good edge case coverage
- **Overall coverage**: Very low (~5% of codebase)
- **No integration tests**: No tests for complete workflows
- **No E2E tests**: No Playwright/Cypress setup
- **No API route tests**: Despite having node-mocks-http installed

---

## 8. FUTURE REQUIRED CHANGES

### Incomplete Features

1. **Cron Job Email Integration** (`src/app/api/cron/`)
   - 3 of 4 cron endpoints have TODO comments for email integration
   - `delivery-reminder`, `expense-overdue`, `timeline-reminder` don't send emails
   - Only `zfd-alert` has email sending implemented

2. **Settings Page** (`src/app/dashboard/settings/page.tsx`)
   - Page exists but functionality is unclear/minimal
   - No user profile editing, no notification preferences

3. **User Deactivation**
   - `active` field exists on User model
   - No UI or action to deactivate/reactivate users
   - Active check not enforced at login

### TODOs and FIXMEs in Code

| Location | Content |
|----------|---------|
| `src/app/api/cron/delivery-reminder/route.ts:7` | TODO: Integrate with email provider |
| `src/app/api/cron/delivery-reminder/route.ts:41` | TODO: Send emails via email provider |
| `src/app/api/cron/expense-overdue/route.ts:8` | TODO: Integrate with email provider |
| `src/app/api/cron/timeline-reminder/route.ts:7` | TODO: Integrate with email provider |

### Scalability Bottlenecks

1. **Single Table with 240+ Columns** - ProgramCard will become increasingly slow to query as data grows
2. **No Pagination** - `getPrograms()` fetches ALL programs without `take`/`skip`
3. **No Database Indexes** - Schema has no explicit indexes beyond primary keys and unique constraints
4. **No Connection Pooling Config** - Prisma default connection pool may not handle concurrent load
5. **Full Program Fetch** - Every query loads all 240 fields; no field selection optimization
6. **No Caching** - Every page load queries the database directly

### Missing Features

1. **Audit Log UI** - StageTransition records exist but no UI to browse full audit history
2. **Notifications Center** - No in-app notification system (only email)
3. **Search & Filter** - Limited search (name/ID/company only); no date, stage, or budget filters
4. **User Profile** - No profile editing, password change
5. **Bulk Actions** - No bulk approve, bulk export, bulk stage transition
6. **Activity Logging** - No logging of who viewed or edited what
7. **Comments/Notes System** - Limited to stage-specific comment fields; no general commenting
8. **Dashboard Customization** - Fixed dashboard layout, no widget customization
9. **Webhook Support** - No webhooks for external system integration
10. **API Documentation** - No OpenAPI/Swagger docs for API endpoints

### Technical Debt

1. **TypeScript `any` types** - Primary data model has no proper interfaces
2. **Legacy form components** - Multiple duplicate form files need cleanup
3. **Console.log statements** - 70+ statements need removal/replacement
4. **NextAuth beta dependency** - Using pre-release version with potential breaking changes
5. **Inconsistent env var naming** - SMTP vs EMAIL prefix confusion
6. **No structured logging** - Console.log is the only logging mechanism

---

## 9. PRODUCTION READINESS CHANGES

### Security

| Issue | Severity | Description |
|-------|----------|-------------|
| Unprotected cron endpoints | High | `/api/cron/*` routes have no authentication; add API key or cron secret |
| No rate limiting | High | Login and API endpoints vulnerable to brute force |
| No CSRF on state-changing GETs | Medium | Cron endpoints use GET for state-changing operations |
| 100MB body size limit | Medium | `next.config.ts` allows 100MB server action bodies; reduce to reasonable limit |
| NextAuth beta | Medium | v5 beta.30 may have security patches pending |
| No Content Security Policy | Medium | No CSP headers configured |
| No HSTS headers | Medium | No strict transport security |
| Seed credentials in repo | Low | Default passwords in seed files (dev-only) |
| No input sanitization | Low | No XSS sanitization on text fields displayed in UI |
| Missing CORS configuration | Low | No explicit CORS policy (Next.js defaults) |

### Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| No pagination on program queries | High | `getPrograms()` loads ALL records |
| No database indexes | High | No explicit indexes on frequently queried fields |
| No caching layer | Medium | Every request hits database directly |
| 240-field SELECT * queries | Medium | No field selection; loads all columns every time |
| No image optimization | Low | File URLs served directly from ImageKit |
| No bundle analysis | Low | No bundle size monitoring or code splitting strategy |
| Client-side date calculations | Low | Date parsing repeated on render in multiple components |

### Reliability

| Issue | Severity | Description |
|-------|----------|-------------|
| No health check endpoint | High | No `/api/health` for load balancer or monitoring |
| No error tracking | High | No Sentry, Datadog, or similar integration |
| No structured logging | High | Only console.log; no log levels or aggregation |
| No React error boundaries | Medium | Component errors crash entire page |
| No email retry mechanism | Medium | Failed emails are lost silently |
| No database connection monitoring | Medium | No alerts for connection pool exhaustion |
| No graceful degradation | Low | No fallback if ImageKit or email service is down |

### DevOps & Deployment

| Issue | Severity | Description |
|-------|----------|-------------|
| No CI/CD pipeline | High | No GitHub Actions, no automated testing on PR |
| No Docker configuration | Medium | No Dockerfile for consistent environments |
| No staging environment config | Medium | Only dev and implied prod; no staging separation |
| No database migration strategy | Medium | Manual `prisma migrate deploy` needed |
| No database backup strategy | Medium | No backup schedules or procedures |
| No environment validation | Medium | No startup check for required env vars |
| No monitoring/alerting | Medium | No uptime monitoring or performance alerts |
| SQLite in dev, PostgreSQL in prod | Low | Different databases between environments |

---

## 10. RECOMMENDED PRIORITY ROADMAP

### Critical - Must Fix Before Launch

1. **Secure Cron Endpoints** - Add API key authentication to all `/api/cron/*` routes. Without this, anyone can trigger reminders and alerts.

2. **Add Rate Limiting** - Implement rate limiting on `/api/auth` and all API routes. Login brute force is currently trivial.

3. **Add Pagination to Program Queries** - `getPrograms()` and dashboard queries currently load ALL records. Will fail with production data volumes.

4. **Add Database Indexes** - Create indexes on: `ProgramCard.currentStage`, `ProgramCard.salesPOCId`, `ProgramCard.opsSPOCId`, `ProgramCard.createdAt`, `ProgramCard.programDates`, `StageTransition.programCardId`.

5. **Fix Environment Variable Naming** - Align `.env.example` with code expectations. The email system won't work for anyone following the example file.

6. **Add Health Check Endpoint** - Create `/api/health` that checks database connectivity.

7. **Set Up CI/CD Pipeline** - Add GitHub Actions workflow for: lint, type-check, test, build.

8. **Fix Duplicate StageTransition Bug** - Stage 2->3 transition creates duplicate audit records. Fix in `actions/stage2.ts`.

9. **Add Error Tracking** - Integrate Sentry or similar for production error monitoring.

10. **Reduce Server Action Body Limit** - Change 100MB to a reasonable limit (e.g., 10-20MB).

### Important - Fix Soon After Launch

11. **Create TypeScript Interfaces** - Define proper `Program`, `User`, `StageTransition` interfaces. Replace all `any` types across 40+ files.

12. **Complete Cron Email Integration** - Wire up email sending in delivery-reminder, expense-overdue, and timeline-reminder endpoints.

13. **Add Structured Logging** - Replace console.log with pino or similar. Add log levels and structured output.

14. **Add React Error Boundaries** - Wrap major sections (dashboard, forms, modals) with error boundaries.

15. **Remove Legacy Components** - Audit and remove unused form components (stage2-form.tsx, stage3-form.tsx, stage5-view.tsx, program-form.tsx).

16. **Add Server-Side Test Coverage** - Write tests for server actions and API routes. Target: approval workflow, rejection flow, stage transitions.

17. **Implement User Active Check** - Enforce `active` field at login time and in middleware. Add UI for user deactivation.

18. **Add CSP and Security Headers** - Configure Content-Security-Policy, X-Frame-Options, HSTS via Next.js headers config.

19. **Dynamic Ops SPOC Selection** - Query active Ops users from database instead of hardcoded names.

20. **Add Database Backup Strategy** - Document and automate PostgreSQL backup schedule.

### Nice to Have - Future Improvements

21. **Extract Date Utilities** - Create shared date parsing and urgency calculation utility.

22. **Add In-App Notifications** - Build notification center for real-time updates.

23. **Implement Optimistic UI Updates** - Kanban board should update immediately on drag with rollback on failure.

24. **Add Audit Log UI** - Build a page to browse StageTransition records with filtering.

25. **Advanced Search & Filters** - Add date range, budget range, stage, and owner filters to program list.

26. **Add E2E Tests** - Set up Playwright for critical user flows.

27. **Normalize ProgramCard Model** - Consider breaking 240-field model into stage-specific tables.

28. **Add Webhook Support** - Allow external systems to subscribe to workflow events.

29. **API Documentation** - Generate OpenAPI/Swagger docs for all endpoints.

30. **Add Docker Configuration** - Create Dockerfile and docker-compose for consistent development and deployment.

31. **Bundle Optimization** - Analyze and optimize client bundle size with code splitting.

32. **Upgrade NextAuth to Stable** - Move from beta.30 to stable release when available.

33. **Add Password Change** - Allow users to change their own passwords.

34. **Implement Bulk Operations** - Bulk approve, bulk export for admin workflows.

35. **Add Dashboard Customization** - Let users configure which widgets they see.

---

*This analysis was generated by reviewing every file in the TreOpsFlow codebase. Findings are based on code inspection as of 2026-03-16.*
