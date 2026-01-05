'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function updateStage4(id: string, data: any) {
    const session = await auth()

    // Who can edit? Ops/Admin/Sales (Sales might enter feedback too, but let's stick to Ops for now as they are the owners until close)
    if (!session) return { error: "Unauthorized" }

    try {
        await prisma.programCard.update({
            where: { id },
            data: {
                npsScore: data.npsScore ? parseInt(data.npsScore) : undefined,
                clientFeedback: data.clientFeedback,
                finalInvoiceSubmitted: data.finalInvoiceSubmitted,
                vendorPaymentsClear: data.vendorPaymentsClear
            }
        })
        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }
    } catch (e) {
        return { error: "Update failed" }
    }
}

export async function moveToStage5(id: string) {
    const session = await auth()
    const userRole = (session?.user as any).role

    // Only Admin or "Finance" should technically close, but sticking to Ops flow as per previous stages, or maybe add Finance check.
    // For simplicity: Ops/Admin can close if criteria met.
    if (userRole !== 'Ops' && userRole !== 'Admin') return { error: "Unauthorized" }

    const program = await prisma.programCard.findUnique({ where: { id } })

    // Exit criteria
    if (program?.npsScore === null || program?.npsScore === undefined) return { error: "NPS Score is required." }
    if (!program?.clientFeedback) return { error: "Client Feedback is required." }
    if (!program?.finalInvoiceSubmitted) return { error: "Final Invoice must be submitted." }

    try {
        await prisma.programCard.update({
            where: { id },
            data: { currentStage: 5 } // 5 = Done
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: id,
                fromStage: 4,
                toStage: 5,
                transitionedBy: (session?.user as any).id,
                approvalNotes: "Program Closed. Feedback recorded."
            }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }
    } catch (e) {
        return { error: "Closure failed" }
    }
}
