'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ProgramSchema = z.object({
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

export async function createProgram(data: any) {
    const session = await auth()

    if (!session?.user || (session.user as any).role !== 'Sales' && (session.user as any).role !== 'Admin') {
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

                salesPOCId: (session.user as any).id,
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

export async function getPrograms() {
    const session = await auth()
    if (!session?.user) return []

    const user = session.user as any

    // Roles see all for now, or filter by owner? 
    // Admin/Ops/Finance see all. Sales see their own?
    // Docs say: View All Cards = All Roles.

    return await prisma.programCard.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            salesOwner: { select: { name: true } }
        }
    })
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
