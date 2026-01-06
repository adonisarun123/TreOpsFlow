'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"
import { z } from "zod"

// --- USER MANAGEMENT ---

export async function getUsers() {
    const session = await auth()
    if ((session?.user as any).role !== 'Admin') return [] // Only Admin

    return await prisma.user.findMany({
        orderBy: { name: 'asc' }
    })
}

const CreateUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['Admin', 'Sales', 'Ops', 'Finance'])
})

export async function createUser(data: z.infer<typeof CreateUserSchema>) {
    const session = await auth()
    if ((session?.user as any).role !== 'Admin') return { error: "Unauthorized" }

    const validated = CreateUserSchema.safeParse(data)
    if (!validated.success) return { error: "Invalid data" }

    const { name, email, password, role } = validated.data

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { error: "Email already exists" }

    const hashedPassword = await hash(password, 10)

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role
            }
        })
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

    // Basic Stats
    const totalPrograms = await prisma.programCard.count()
    const activePrograms = await prisma.programCard.count({
        where: { currentStage: { lt: 5 } } // Not closed
    })
    const completedPrograms = await prisma.programCard.count({
        where: { currentStage: 5 }
    })

    // Revenue (Sum of deliveryBudget of all programs? Or just closed ones? Let's do all for pipeline view)
    const pipelineRevenue = await prisma.programCard.aggregate({
        _sum: { deliveryBudget: true }
    })

    return {
        totalPrograms,
        activePrograms,
        completedPrograms,
        pipelineRevenue: pipelineRevenue._sum.deliveryBudget || 0
    }
}
