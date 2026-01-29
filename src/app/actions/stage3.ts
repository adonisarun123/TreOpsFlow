'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"
import { stageCompletedEmail } from "@/lib/email-templates"
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
                initialExpenseSheet: data.initialExpenseSheet,
                tripExpenseSheet: data.tripExpenseSheet,
                packingCheckDone: data.packingCheckDone,
                actualParticipantCount: data.actualParticipantCount,
                medicalIssues: data.medicalIssues,
                medicalIssueDetails: data.medicalIssuesDetails, // Form uses plural, DB uses singular
                facilitatorRemarks: data.facilitatorRemarks,
                bdLeadGenDone: data.bdLeadGenDone,
                activitiesExecuted: data.activitiesExecuted,
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

    if (!program) {
        return { error: "Program not found" }
    }

    // Stage 3 → Stage 4 Exit Criteria
    const errors: string[] = []

    if (!program.tripExpenseSheet) {
        errors.push("Trip expense sheet must be uploaded (mandatory)")
    }

    if (!program.packingCheckDone) {
        errors.push("Packing checklist must be completed")
    }

    if (errors.length > 0) {
        return { error: "Cannot progress to Stage 4", details: errors }
    }

    try {
        await prisma.programCard.update({
            where: { id },
            data: { currentStage: 4 }
        })

        // Send email to Ops Owner
        try {
            const updatedProgram = await prisma.programCard.findUnique({
                where: { id },
                include: { opsOwner: true }
            })

            if (updatedProgram?.opsOwner?.email) {
                await sendEmail({
                    to: updatedProgram.opsOwner.email,
                    ...stageCompletedEmail({
                        id: updatedProgram.id,
                        programName: updatedProgram.programName,
                        programId: updatedProgram.programId,
                        opsOwnerName: updatedProgram.opsOwner.name || 'Ops Team',
                        completedStage: 3,
                        nextStage: 4,
                    })
                })
            }
        } catch (emailError) {
            console.error('Stage 3 completion email failed:', emailError)
        }

        await prisma.stageTransition.create({
            data: {
                programCardId: id,
                fromStage: 3,
                toStage: 4,
                transitionedBy: (session?.user as any).id,
                approvalNotes: "Delivery complete. Trip expense sheet submitted."
            }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }
    } catch (e) {
        return { error: "Transition failed" }
    }
}
