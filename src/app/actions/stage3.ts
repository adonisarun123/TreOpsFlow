'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const Stage3Schema = z.object({
    venueReached: z.boolean().optional(),
    facilitatorsReached: z.boolean().optional(),
    programCompleted: z.boolean().optional(),

    deliveryNotes: z.string().optional(),

    // Check for existence of url
    initialExpenseSheet: z.string().optional(),
})

export async function updateStage3(id: string, data: any) {
    const session = await auth()

    // Who can edit? Ops/Admin
    if (!session) return { error: "Unauthorized" }

    try {
        await prisma.programCard.update({
            where: { id },
            data: {
                venueReached: data.venueReached,
                facilitatorsReached: data.facilitatorsReached,
                programCompleted: data.programCompleted,
                deliveryNotes: data.deliveryNotes,
                initialExpenseSheet: data.initialExpenseSheet
            }
        })
        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }
    } catch (e) {
        return { error: "Update failed" }
    }
}

export async function moveToStage4(id: string) {
    const session = await auth()
    const userRole = (session?.user as any).role

    if (userRole !== 'Ops' && userRole !== 'Admin') return { error: "Unauthorized" }

    const program = await prisma.programCard.findUnique({ where: { id } })

    // Exit criteria check
    if (!program?.programCompleted) return { error: "Program must be marked as completed." }
    if (!program?.initialExpenseSheet) return { error: "Initial expense sheet must be uploaded." }

    try {
        await prisma.programCard.update({
            where: { id },
            data: { currentStage: 4 }
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: id,
                fromStage: 3,
                toStage: 4,
                transitionedBy: (session?.user as any).id,
                approvalNotes: "Delivery complete. Moved to Post-Delivery."
            }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }
    } catch (e) {
        return { error: "Transition failed" }
    }
}
