'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"
import { z } from "zod"

// --- USER MANAGEMENT ---

export async function getUsers() {
    const session = await auth()
    if (session?.user?.role !== 'Admin') return []
    return await prisma.user.findMany({ orderBy: { name: 'asc' } })
}

const CreateUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['Admin', 'Sales', 'Ops', 'Finance'])
})

export async function createUser(data: z.infer<typeof CreateUserSchema>) {
    const session = await auth()
    if (session?.user?.role !== 'Admin') return { error: "Unauthorized" }
    const validated = CreateUserSchema.safeParse(data)
    if (!validated.success) return { error: "Invalid data" }
    const { name, email, password, role } = validated.data
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { error: "Email already exists" }
    const hashedPassword = await hash(password, 10)
    try {
        await prisma.user.create({ data: { name, email, password: hashedPassword, role } })
        revalidatePath('/dashboard/team')
        return { success: true }
    } catch (e) {
        return { error: "Failed to create user" }
    }
}

// --- REPORTS / ANALYTICS ---

export async function getDashboardStats() {
    const session = await auth()
    if (!session) return null

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Batch all queries into a single transaction (~15 queries → 1 round trip)
    const [
        totalPrograms,
        activePrograms,
        completedPrograms,
        pendingPrograms,
        pipelineRevenue,
        completedRevenue,
        stageDistribution,
        thisMonthRevenue,
        lastMonthRevenue,
        weeklyNew,
    ] = await prisma.$transaction([
        prisma.programCard.count(),
        prisma.programCard.count({ where: { currentStage: { gte: 1, lte: 5 } } }),
        prisma.programCard.count({ where: { currentStage: 6 } }),
        prisma.programCard.count({ where: { currentStage: 1 } }),
        prisma.programCard.aggregate({ _sum: { deliveryBudget: true } }),
        prisma.programCard.aggregate({ _sum: { deliveryBudget: true }, where: { currentStage: 6 } }),
        // Single groupBy replaces 6 separate count queries
        prisma.programCard.groupBy({ by: ['currentStage'], orderBy: { currentStage: 'asc' }, _count: { _all: true } }),
        prisma.programCard.aggregate({ _sum: { deliveryBudget: true }, where: { createdAt: { gte: thisMonthStart } } }),
        prisma.programCard.aggregate({ _sum: { deliveryBudget: true }, where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
        prisma.programCard.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    ])

    // Build stage counts from groupBy result
    const stageCounts = [1, 2, 3, 4, 5, 6].map(stage => ({
        stage,
        count: (stageDistribution.find((s: any) => s.currentStage === stage)?._count as any)?._all || 0,
    }))

    const thisMonthVal = thisMonthRevenue._sum.deliveryBudget || 0
    const lastMonthVal = lastMonthRevenue._sum.deliveryBudget || 0
    const growthPct = lastMonthVal > 0 ? ((thisMonthVal - lastMonthVal) / lastMonthVal) * 100 : 0

    return {
        totalPrograms,
        activePrograms,
        completedPrograms,
        pendingPrograms,
        pipelineRevenue: pipelineRevenue._sum.deliveryBudget || 0,
        completedRevenue: completedRevenue._sum.deliveryBudget || 0,
        stageCounts,
        thisMonthRevenue: thisMonthVal,
        lastMonthRevenue: lastMonthVal,
        growthPct: Math.round(growthPct * 10) / 10,
        weeklyNew,
    }
}

// Revenue by program type — uses groupBy instead of fetching all records
export async function getRevenueByType() {
    const session = await auth()
    if (!session) return []

    const grouped = await prisma.programCard.groupBy({
        by: ['programType'],
        orderBy: { programType: 'asc' },
        _sum: { deliveryBudget: true },
        _count: { _all: true },
    })

    return grouped
        .map((g: any) => ({
            type: g.programType || 'Unspecified',
            revenue: g._sum.deliveryBudget || 0,
            count: g._count?._all || 0,
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
}

// Facilitator workload
export async function getFacilitatorWorkload() {
    const session = await auth()
    if (!session) return []

    const programs = await prisma.programCard.findMany({
        select: { opsSPOCAssignedName: true, deliveryBudget: true, currentStage: true },
        where: { opsSPOCAssignedName: { not: null } }
    })

    const map: Record<string, { active: number; completed: number; total: number; revenue: number }> = {}
    for (const p of programs) {
        const name = p.opsSPOCAssignedName || 'Unassigned'
        if (!map[name]) map[name] = { active: 0, completed: 0, total: 0, revenue: 0 }
        map[name].total += 1
        map[name].revenue += p.deliveryBudget || 0
        if (p.currentStage === 6) map[name].completed += 1
        else map[name].active += 1
    }

    return Object.entries(map).map(([name, data]) => ({
        name,
        ...data,
    })).sort((a, b) => b.active - a.active)
}

// Equipment/transport tracking
export async function getTransportReport() {
    const session = await auth()
    if (!session) return []

    return await prisma.programCard.findMany({
        where: {
            currentStage: { gte: 3, lte: 5 },
            transportationBlocking: true,
        },
        select: {
            id: true,
            programId: true,
            programName: true,
            currentStage: true,
            teamTransportDetails: true,
            clientTransportDetails: true,
            location: true,
            programDates: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    })
}

// Recent activity feed
export async function getRecentActivity() {
    const session = await auth()
    if (!session) return []

    const transitions = await prisma.stageTransition.findMany({
        orderBy: { transitionedAt: 'desc' },
        take: 20,
        include: {
            user: { select: { name: true, role: true } },
            programCard: { select: { programName: true, programId: true, deliveryBudget: true } },
        },
    })

    return transitions.map(t => ({
        id: t.id,
        programName: t.programCard.programName,
        programId: t.programCard.programId,
        fromStage: t.fromStage,
        toStage: t.toStage,
        userName: t.user.name,
        userRole: t.user.role,
        budget: t.programCard.deliveryBudget,
        transitionedAt: t.transitionedAt.toISOString(),
    }))
}

// Monthly revenue — batched into single transaction instead of 6 sequential queries
export async function getMonthlyRevenue() {
    const session = await auth()
    if (!session) return []

    const now = new Date()
    const monthRanges = Array.from({ length: 6 }, (_, i) => {
        const idx = 5 - i
        const start = new Date(now.getFullYear(), now.getMonth() - idx, 1)
        const end = new Date(now.getFullYear(), now.getMonth() - idx + 1, 0)
        const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        return { start, end, label }
    })

    const results = await prisma.$transaction(
        monthRanges.map(({ start, end }) =>
            prisma.programCard.aggregate({
                _sum: { deliveryBudget: true },
                _count: true,
                where: { createdAt: { gte: start, lte: end } },
            })
        )
    )

    return monthRanges.map((range, i) => ({
        month: range.label,
        revenue: results[i]._sum.deliveryBudget || 0,
        count: results[i]._count || 0,
    }))
}
