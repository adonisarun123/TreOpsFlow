'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"
import { budgetApprovedEmail, opsHandoverReadyEmail, handoverToOpsEmail } from "@/lib/email-templates"
import { canProgressFromStage1 } from "@/lib/validations"

export async function approveFinance(programId: string) {
    const session = await auth()
    if (!session) {
        return { success: false, error: "Unauthorized" }
    }

    const userRole = (session.user as any)?.role
    if (userRole !== 'Finance' && userRole !== 'Admin') {
        return { success: false, error: "Only Finance or Admin can approve budget" }
    }

    try {
        const program = await prisma.programCard.update({
            where: { id: programId },
            data: { financeApprovalReceived: true },
            include: { salesOwner: true }
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
        return { success: true }
    } catch (error) {
        console.error("Finance approval error:", error)
        return { success: false, error: "Failed to approve budget" }
    }
}

export async function acceptHandover(programId: string) {
    const session = await auth()
    if (!session) {
        return { success: false, error: "Unauthorized" }
    }

    const user = session.user as any
    const userRole = user?.role
    if (userRole !== 'Ops' && userRole !== 'Admin') {
        return { success: false, error: "Only Ops or Admin can accept handover" }
    }

    try {
        const program = await prisma.programCard.findUnique({
            where: { id: programId }
        })

        if (!program?.financeApprovalReceived) {
            return { success: false, error: "Finance approval required first" }
        }

        // Assign current user as SPOC and mark handover accepted
        await prisma.programCard.update({
            where: { id: programId },
            data: {
                opsSPOCId: user.id,
                handoverAcceptedByOps: true
            }
        })

        // Now perform the Stage 1→2 transition with comprehensive validation
        const result = await moveToStage2(programId, user.id)

        if (!result.success) {
            return { success: false, error: result.error || "Failed to move to Stage 2" }
        }

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

export async function moveToStage2(programId: string, transitionedByUserId: string) {
    try {
        const program = await prisma.programCard.findUnique({
            where: { id: programId },
            include: {
                opsOwner: true
            }
        })

        if (!program) {
            return { success: false, error: "Program not found" }
        }

        // Use centralized Stage 1 exit criteria validation
        const validation = canProgressFromStage1(program)

        if (!validation.isValid) {
            return {
                success: false,
                error: "Cannot move to Stage 2. Missing requirements:",
                details: validation.errors
            }
        }

        // All validations passed - move to Stage 2
        await prisma.programCard.update({
            where: { id: programId },
            data: {
                currentStage: 2,
            }
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: programId,
                fromStage: 1,
                toStage: 2,
                transitionedBy: transitionedByUserId,
                approvalNotes: "Handover accepted."
            }
        })

        revalidatePath(`/dashboard/programs/${programId}`)
        return { success: true }
    } catch (e) {
        return { error: "Failed to accept handover." }
    }
}
