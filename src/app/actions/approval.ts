'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function approveFinance(programId: string) {
    const session = await auth()
    const user = session?.user as any

    if (user?.role !== 'Finance' && user?.role !== 'Admin') {
        return { error: "Unauthorized. Only Finance can approve budget." }
    }

    try {
        await prisma.programCard.update({
            where: { id: programId },
            data: { financeApprovalReceived: true }
        })

        // Log transition or something? 
        // For MVP, just update.

        revalidatePath(`/dashboard/programs/${programId}`)
        return { success: true }
    } catch (e) {
        return { error: "Failed to approve." }
    }
}

export async function acceptHandover(programId: string) {
    const session = await auth()
    const user = session?.user as any

    if (user?.role !== 'Ops' && user?.role !== 'Admin') {
        return { error: "Unauthorized. Only Ops can accept handover." }
    }

    // Check if finance approved?
    const program = await prisma.programCard.findUnique({ where: { id: programId } })
    if (!program?.financeApprovalReceived) {
        return { error: "Cannot accept handover before Finance approval." }
    }

    try {
        await prisma.programCard.update({
            where: { id: programId },
            data: {
                handoverAcceptedByOps: true,
                opsSPOCId: user.id, // Assign current user as SPOC
                currentStage: 2 // Move to Stage 2 automatically upon acceptance
            }
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: programId,
                fromStage: 1,
                toStage: 2,
                transitionedBy: user.id,
                approvalNotes: "Handover accepted."
            }
        })

        revalidatePath(`/dashboard/programs/${programId}`)
        return { success: true }
    } catch (e) {
        return { error: "Failed to accept handover." }
    }
}
