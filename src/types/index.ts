/**
 * Shared TypeScript types for TreOpsFlow.
 *
 * Uses Prisma-generated types as the source of truth,
 * with additional utility types for the application layer.
 */

import type { Prisma, ProgramCard, User, StageTransition } from "@prisma/client"

// Re-export Prisma model types for convenience
export type { ProgramCard, User, StageTransition }

// ─── Session & Auth Types ────────────────────────────────────────────────────

/** User role enum (matches Prisma schema string values) */
export type UserRole = "Sales" | "Ops" | "Finance" | "Admin"

/** Authenticated user from NextAuth session — typed alternative to `session.user as any` */
export interface SessionUser {
    id: string
    name: string
    email: string
    role: UserRole
}

// ─── Program Types with Relations ────────────────────────────────────────────

/** ProgramCard with salesOwner relation (name only) — used in list views */
export type ProgramWithSalesOwner = Prisma.ProgramCardGetPayload<{
    include: { salesOwner: { select: { name: true } } }
}>

/** ProgramCard with both owners — used in detail views */
export type ProgramWithOwners = Prisma.ProgramCardGetPayload<{
    include: {
        salesOwner: { select: { name: true } }
        opsOwner: { select: { name: true } }
    }
}>

/** ProgramCard with all relations — used in full program detail */
export type ProgramFull = Prisma.ProgramCardGetPayload<{
    include: {
        salesOwner: { select: { name: true; email: true } }
        opsOwner: { select: { name: true; email: true } }
        transitions: true
    }
}>

// ─── Pagination Types ────────────────────────────────────────────────────────

/** Generic paginated response */
export interface PaginatedResponse<T> {
    programs: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

/** Pagination parameters for queries */
export interface PaginationParams {
    page?: number
    pageSize?: number
    stage?: number
    search?: string
}

// ─── Stage Types ─────────────────────────────────────────────────────────────

/** Stage numbers (1-6) */
export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6

/** Stage names mapping */
export const STAGE_NAMES: Record<StageNumber, string> = {
    1: "Tentative Handover",
    2: "Accepted Handover",
    3: "Feasibility & Preps",
    4: "Delivery",
    5: "Post Trip Closure",
    6: "Done",
}

/** Rejection status values */
export type RejectionStatus = "rejected_finance" | "rejected_ops" | null

// ─── Server Action Response Types ────────────────────────────────────────────

/** Standard success/error response from server actions */
export type ActionResponse =
    | { success: true; programId?: string }
    | { error: string; details?: string[] }

/** Validation result from stage progression checks */
export interface ValidationResult {
    isValid: boolean
    errors: string[]
}

// ─── Dashboard / Report Types ────────────────────────────────────────────────

export interface DashboardStats {
    totalPrograms: number
    activePrograms: number
    completedPrograms: number
    pendingPrograms: number
    pipelineRevenue: number
    completedRevenue: number
    stageCounts: { stage: number; count: number }[]
    thisMonthRevenue: number
    lastMonthRevenue: number
    growthPct: number
    weeklyNew: number
}

export interface RevenueByType {
    type: string
    revenue: number
    count: number
}

export interface FacilitatorWorkload {
    name: string
    active: number
    completed: number
    total: number
    revenue: number
}

export interface RecentActivity {
    id: string
    programName: string
    programId: string
    fromStage: number
    toStage: number
    userName: string
    userRole: string
    budget: number | null
    transitionedAt: string
}
