'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"
import { budgetApprovedEmail, opsHandoverReadyEmail, handoverToOpsEmail } from "@/lib/email-templates"
import { canProgressFromStage1 } from "@/lib/validations"

/**
 * Finance approves the budget.
 * On approval: auto-moves program from Stage 1 (Tentative Handover) to Stage 2 (Accepted Handover).
 */
export async function approveFinance(programId: string) {
    const session = await auth()
    if (!session) {
        return { success: false, error: "Unauthorized" }
    }

    const userRole = session.user?.role
    const userId = session.user?.id
    if (userRole !== 'Finance' && userRole !== 'Admin') {
        return { success: false, error: "Only Finance or Admin can approve budget" }
    }

    try {
        // Mark finance approval
        const program = await prisma.programCard.update({
            where: { id: programId },
            data: { financeApprovalReceived: true },
            include: { salesOwner: true }
        })

        // Auto-move to Stage 2 (Accepted Handover)
        await prisma.programCard.update({
            where: { id: programId },
            data: { currentStage: 2 }
        })

        // Create stage transition record
        await prisma.stageTransition.create({
            data: {
                programCardId: programId,
                fromStage: 1,
                toStage: 2,
                transitionedBy: userId,
                approvalNotes: "Finance approved. Auto-moved to Accepted Handover."
            }
        })

        // Send email to Sales Owner
        try {
            if (program.salesOwner?.email) {
                await sendEmail({
                    to: program.salesOwner.email,
                    ...budgetApprovedEmail({
                        id: program.id,
                        programName: program.programName,
                        programId: program.programId,
                        salesOwnerName: program.salesOwner.name || 'Sales Owner',
                    })
                })
            }

            // Send email to Ops team
            const opsUsers = await prisma.user.findMany({
                where: { role: { in: ['Ops', 'Admin'] } }
            })
            const opsEmails = opsUsers.map(u => u.email).filter(Boolean)

            if (opsEmails.length > 0) {
                await sendEmail({
                    to: opsEmails,
                    ...opsHandoverReadyEmail({
                        id: program.id,
                        programName: program.programName,
                        programId: program.programId,
                        salesOwnerName: program.salesOwner?.name || 'Sales Owner',
                        clientName: program.companyName || 'Client',
                        budget: program.deliveryBudget || 0,
                    })
                })
            }
        } catch (emailError) {
            console.error('Budget approved email failed:', emailError)
        }

        revalidatePath(`/dashboard/programs/${programId}`)
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error("Finance approval error:", error)
        return { success: false, error: "Failed to approve budget" }
    }
}

/**
 * Ops accepts the handover in Stage 2 (Accepted Handover).
 * This just marks the handover as accepted - does NOT move to Stage 3.
 * Stage 3 transition happens via the Stage 2 form's "Move to Feasibility" button.
 */
export async function acceptHandover(programId: string) {
    const session = await auth()
    if (!session) {
        return { success: false, error: "Unauthorized" }
    }

    const user = session.user
    const userRole = user?.role
    if (userRole !== 'Ops' && userRole !== 'Admin') {
        return { success: false, error: "Only Ops or Admin can accept handover" }
    }

    try {
        // Assign current user as SPOC and mark handover accepted
        await prisma.programCard.update({
            where: { id: programId },
            data: {
                opsSPOCId: user.id,
                handoverAcceptedByOps: true
            }
        })

        // Send email to Ops SPOC
        try {
            const programWithDetails = await prisma.programCard.findUnique({
                where: { id: programId },
                include: { opsOwner: true }
            })

            if (programWithDetails?.opsOwner?.email) {
                await sendEmail({
                    to: programWithDetails.opsOwner.email,
                    ...handoverToOpsEmail({
                        id: programWithDetails.id,
                        programName: programWithDetails.programName,
                        programId: programWithDetails.programId,
                        opsSPOCName: programWithDetails.opsOwner.name || 'Ops SPOC',
                        clientName: programWithDetails.companyName || 'Client',
                        location: programWithDetails.location || 'TBD',
                    })
                })
            }
        } catch (emailError) {
            console.error('Handover email failed:', emailError)
        }

        revalidatePath(`/dashboard/programs/${programId}`)
        return { success: true }
    } catch (error) {
        console.error("Handover acceptance error:", error)
        return { success: false, error: "Failed to accept handover" }
    }
}

/**
 * Legacy moveToStage2 - kept for compatibility but now the auto-move
 * happens inside approveFinance() directly.
 */
export async function moveToStage2(programId: string, transitionedByUserId: string) {
    try {
        const program = await prisma.programCard.findUnique({
            where: { id: programId },
            include: { opsOwner: true }
        })

        if (!program) {
            return { success: false, error: "Program not found" }
        }

        const validation = canProgressFromStage1(program)
        if (!validation.isValid) {
            return {
                success: false,
                error: "Cannot move to Accepted Handover. Missing requirements:",
                details: validation.errors
            }
        }

        await prisma.programCard.update({
            where: { id: programId },
            data: { currentStage: 2 }
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: programId,
                fromStage: 1,
                toStage: 2,
                transitionedBy: transitionedByUserId,
                approvalNotes: "Moved to Accepted Handover."
            }
        })

        revalidatePath(`/dashboard/programs/${programId}`)
        return { success: true }
    } catch (e) {
        return { error: "Failed to move to Accepted Handover." }
    }
}
