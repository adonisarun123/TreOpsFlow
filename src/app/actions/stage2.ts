'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"
import { stageCompletedEmail } from "@/lib/email-templates"
import { canProgressFromStage2 } from "@/lib/validations"
import { z } from "zod"

const Stage2Schema = z.object({
    facilitatorsBlocked: z.string().optional(),
    helperStaffBlocked: z.string().optional(),
    transportBlocked: z.string().optional(),

    logisticsList: z.string().optional(),
    logisticsListLocked: z.boolean().optional(),

    agendaWalkthroughDone: z.boolean().optional(),
    // travelPlanDocument: z.string().optional(),

    prepComplete: z.boolean().optional(),
})

export async function updateProgram(id: string, data: any) {
    const session = await auth()
    const userRole = (session?.user as any).role

    // Who can edit? Ops/Admin for Stage 2, Sales/Admin for Stage 1 details
    // For now simple check
    if (!session) return { error: "Unauthorized" }

    try {
        await prisma.programCard.update({
            where: { id },
            data: {
                facilitatorsBlocked: data.facilitatorsBlocked,
                helperStaffBlocked: data.helperStaffBlocked,
                transportBlocked: data.transportBlocked,
                logisticsList: data.logisticsList,
                logisticsListLocked: data.logisticsListLocked,
                logisticsListDocument: data.logisticsListDocument,
                travelPlanDocument: data.travelPlanDocument,
                agendaDocumentStage2: data.agendaDocumentStage2,
                agendaWalkthroughDone: data.agendaWalkthroughDone,
                allResourcesBlocked: data.allResourcesBlocked,
                prepComplete: data.prepComplete
            }
        })
        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }
    } catch (e) {
        return { error: "Update failed" }
    }
}

export async function moveToStage3(programId: string) {
    const session = await auth()
    const userRole = (session?.user as any).role

    if (userRole !== 'Ops' && userRole !== 'Admin') return { error: "Unauthorized" }

    const program = await prisma.programCard.findUnique({ where: { id: programId } })

    if (!program) {
        return { error: "Program not found" }
    }

    // Use centralized Stage 2 exit criteria validation
    const validation = canProgressFromStage2(program)

    if (!validation.isValid) {
        return { error: "Cannot progress to Stage 3", details: validation.errors }
    }

    try {
        await prisma.programCard.update({
            where: { id: programId },
            data: { currentStage: 3 }
        })

        // Send email to Ops Owner
        try {
            const programWithOpsOwner = await prisma.programCard.findUnique({
                where: { id: programId },
                include: { opsOwner: true }
            })

            if (programWithOpsOwner?.opsOwner?.email) {
                await sendEmail({
                    to: programWithOpsOwner.opsOwner.email,
                    ...stageCompletedEmail({
                        id: programWithOpsOwner.id,
                        programName: programWithOpsOwner.programName,
                        programId: programWithOpsOwner.programId,
                        opsOwnerName: programWithOpsOwner.opsOwner.name || 'Ops Team',
                        completedStage: 2,
                        nextStage: 3,
                    })
                })
            }
        } catch (emailError) {
            console.error('Stage 2 completion email failed:', emailError)
        }

        await prisma.stageTransition.create({
            data: {
                programCardId: programId,
                fromStage: 2,
                toStage: 3,
                transitionedBy: (session?.user as any).id,
                approvalNotes: "Stage 2 complete. All resources blocked, prep done."
            }
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: programId,
                fromStage: 2,
                toStage: 3,
                transitionedBy: (session?.user as any).id,
            }
        })

        revalidatePath(`/dashboard/programs/${programId}`)
        return { success: true }
    } catch (e) {
        return { error: "Transition failed" }
    }
}
