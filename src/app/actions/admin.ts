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

    const totalPrograms = await prisma.programCard.count()
    const activePrograms = await prisma.programCard.count({ where: { currentStage: { gte: 1, lte: 5 } } })
    const completedPrograms = await prisma.programCard.count({ where: { currentStage: 6 } })
    const pendingPrograms = await prisma.programCard.count({ where: { currentStage: 1 } })

    const pipelineRevenue = await prisma.programCard.aggregate({ _sum: { deliveryBudget: true } })
    const completedRevenue = await prisma.programCard.aggregate({
        _sum: { deliveryBudget: true },
        where: { currentStage: 6 }
    })

    // Stage distribution
    const stageCounts = await Promise.all(
        [1, 2, 3, 4, 5, 6].map(async (stage) => ({
            stage,
            count: await prisma.programCard.count({ where: { currentStage: stage } }),
        }))
    )

    // Revenue growth: this month vs last month
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonthRevenue = await prisma.programCard.aggregate({
        _sum: { deliveryBudget: true },
        where: { createdAt: { gte: thisMonthStart } }
    })
    const lastMonthRevenue = await prisma.programCard.aggregate({
        _sum: { deliveryBudget: true },
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }
    })

    const thisMonthVal = thisMonthRevenue._sum.deliveryBudget || 0
    const lastMonthVal = lastMonthRevenue._sum.deliveryBudget || 0
    const growthPct = lastMonthVal > 0 ? ((thisMonthVal - lastMonthVal) / lastMonthVal) * 100 : 0

    // Programs created this week
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weeklyNew = await prisma.programCard.count({ where: { createdAt: { gte: oneWeekAgo } } })

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

// Item 8: Revenue by program type
export async function getRevenueByType() {
    const session = await auth()
    if (!session) return []

    const programs = await prisma.programCard.findMany({
        select: { programType: true, deliveryBudget: true },
    })

    const typeMap: Record<string, { revenue: number; count: number }> = {}
    for (const p of programs) {
        const type = p.programType || 'Unspecified'
        if (!typeMap[type]) typeMap[type] = { revenue: 0, count: 0 }
        typeMap[type].revenue += p.deliveryBudget || 0
        typeMap[type].count += 1
    }

    return Object.entries(typeMap).map(([type, data]) => ({
        type,
        revenue: data.revenue,
        count: data.count,
    })).sort((a, b) => b.revenue - a.revenue)
}

// Item 9: Facilitator workload
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

// Item 10: Equipment/transport tracking
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

// Item 15: Recent activity feed (from StageTransition table)
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

// Monthly revenue breakdown (last 6 months)
export async function getMonthlyRevenue() {
    const session = await auth()
    if (!session) return []

    const now = new Date()
    const months: { month: string; revenue: number; count: number }[] = []

    for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthLabel = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

        const result = await prisma.programCard.aggregate({
            _sum: { deliveryBudget: true },
            _count: true,
            where: { createdAt: { gte: start, lte: end } },
        })

        months.push({
            month: monthLabel,
            revenue: result._sum.deliveryBudget || 0,
            count: result._count || 0,
        })
    }

    return months
}
