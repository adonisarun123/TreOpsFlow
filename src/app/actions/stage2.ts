'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
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
                agendaWalkthroughDone: data.agendaWalkthroughDone,
                prepComplete: data.prepComplete
            }
        })
        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }
    } catch (e) {
        return { error: "Update failed" }
    }
}

export async function moveToStage3(id: string) {
    const session = await auth()
    const userRole = (session?.user as any).role

    if (userRole !== 'Ops' && userRole !== 'Admin') return { error: "Unauthorized" }

    const program = await prisma.programCard.findUnique({ where: { id } })

    // Exit criteria check
    if (!program?.prepComplete) return { error: "Preparation not marked as complete." }
    if (!program?.logisticsListLocked) return { error: "Logistics list must be locked." }
    // if (!program.facilitatorsBlocked) ... strict checks here

    try {
        await prisma.programCard.update({
            where: { id },
            data: { currentStage: 3 }
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: id,
                fromStage: 2,
                toStage: 3,
                transitionedBy: (session?.user as any).id,
                approvalNotes: "Stage 2 complete."
            }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }
    } catch (e) {
        return { error: "Transition failed" }
    }
}
