'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const _ProgramSchema = z.object({
    programName: z.string().min(1, "Program name is required"),
    programType: z.string().optional(),
    programDates: z.array(z.string()).optional(), // Will store as JSON string
    location: z.string().optional(),
    minPax: z.number().optional(),
    maxPax: z.number().optional(),

    // Client POC
    clientPOCName: z.string().optional(),
    clientPOCPhone: z.string().optional(),
    clientPOCEmail: z.string().email().optional().or(z.literal('')),
    companyName: z.string().optional(),

    // Commercials
    deliveryBudget: z.number().optional(),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProgram(data: Record<string, any>) {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'Sales' && session.user.role !== 'Admin')) {
        return { error: "Unauthorized. Only Sales or Admin can create programs." }
    }

    // Generate Program ID (Simple logic for now: TRB-Year-Random)
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    const programId = `TRB-${year}-${random}`;

    try {
        const program = await prisma.programCard.create({
            data: {
                programId,
                programName: data.programName,
                programType: data.programType,
                programDates: data.programDates ? JSON.stringify(data.programDates) : undefined,
                location: data.location,
                minPax: data.minPax ? parseInt(data.minPax) : undefined,
                maxPax: data.maxPax ? parseInt(data.maxPax) : undefined,

                clientPOCName: data.clientPOCName,
                clientPOCPhone: data.clientPOCPhone,
                clientPOCEmail: data.clientPOCEmail,
                companyName: data.companyName,

                deliveryBudget: data.deliveryBudget ? parseFloat(data.deliveryBudget) : undefined,

                salesPOCId: session.user.id,
                currentStage: 1,
            }
        })

        revalidatePath('/dashboard')
        return { success: true, programId: program.id }
    } catch (error) {
        console.error("Failed to create program:", error)
        return { error: "Failed to create program." }
    }
}

/**
 * getPrograms — returns ALL programs (used by Kanban board which needs all stages).
 * For paginated access, use getProgramsPaginated().
 */
export async function getPrograms() {
    const session = await auth()
    if (!session?.user) return []

    return await prisma.programCard.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            salesOwner: { select: { name: true } }
        }
    })
}

/**
 * getProgramsPaginated — paginated program list for the table view.
 * @param page - 1-indexed page number (default: 1)
 * @param pageSize - items per page (default: 25, max: 100)
 * @param stage - optional stage filter (1-6)
 * @param search - optional search string (matches programName, programId, companyName)
 */
export async function getProgramsPaginated({
    page = 1,
    pageSize = 25,
    stage,
    search,
}: {
    page?: number
    pageSize?: number
    stage?: number
    search?: string
} = {}) {
    const session = await auth()
    if (!session?.user) return { programs: [], total: 0, page: 1, pageSize: 25, totalPages: 0 }

    // Clamp pageSize to prevent abuse
    const safePage = Math.max(1, page)
    const safePageSize = Math.min(Math.max(1, pageSize), 100)

    // Build where clause
    const where: Record<string, unknown> = {}
    if (stage && stage >= 1 && stage <= 6) {
        where.currentStage = stage
    }
    if (search && search.trim()) {
        where.OR = [
            { programName: { contains: search.trim(), mode: 'insensitive' } },
            { programId: { contains: search.trim(), mode: 'insensitive' } },
            { companyName: { contains: search.trim(), mode: 'insensitive' } },
        ]
    }

    const [programs, total] = await Promise.all([
        prisma.programCard.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (safePage - 1) * safePageSize,
            take: safePageSize,
            include: {
                salesOwner: { select: { name: true } },
            },
        }),
        prisma.programCard.count({ where }),
    ])

    return {
        programs,
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages: Math.ceil(total / safePageSize),
    }
}

export async function getProgramById(id: string) {
    const session = await auth()
    if (!session?.user) return null

    return await prisma.programCard.findUnique({
        where: { id },
        include: {
            salesOwner: { select: { name: true } },
            opsOwner: { select: { name: true } }
        }
    })
}

export async function updateProgramStage(programId: string, stage: number) {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }

    try {
        await prisma.programCard.update({
            where: { id: programId },
            data: { currentStage: stage }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error("Failed to update program stage:", error)
        return { error: "Failed to update program stage." }
    }
}
