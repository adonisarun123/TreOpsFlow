'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"
import { financeRejectedEmail, opsRejectedEmail, programResubmittedEmail } from "@/lib/email-templates"

/**
 * Finance rejects a program with mandatory reason
 */
export async function rejectFinance(programId: string, reason: string) {
    const session = await auth()
    const userRole = (session?.user as any)?.role
    const userId = (session?.user as any)?.id

    if (userRole !== 'Finance' && userRole !== 'Admin') {
        return { success: false, error: "Unauthorized - Finance role required" }
    }

    if (!reason || reason.trim().length < 10) {
        return { success: false, error: "Rejection reason must be at least 10 characters" }
    }

    try {
        const program = await prisma.programCard.update({
            where: { id: programId },
            data: {
                rejectionStatus: 'rejected_finance',
                financeRejectionReason: reason.trim(),
                rejectedBy: userId,
                rejectedAt: new Date(),
                financeApprovalReceived: false,
            },
            include: {
                salesOwner: true
            }
        })

        // Send email to Sales Owner
        try {
            if (program.salesOwner?.email) {
                await sendEmail({
                    to: program.salesOwner.email,
                    ...financeRejectedEmail({
                        id: program.id,
                        programName: program.programName,
                        programId: program.programId,
                        salesOwnerName: program.salesOwner.name || 'Sales Owner',
                        rejectionReason: reason.trim(),
                    })
                })
            }
        } catch (emailError) {
            console.error('Finance rejection email failed:', emailError)
        }

        revalidatePath(`/dashboard/programs/${programId}`)
        return { success: true }
    } catch (error) {
        console.error('Finance rejection error:', error)
        return { success: false, error: "Failed to reject program" }
    }
}

/**
 * Ops rejects handover with mandatory reason
 */
export async function rejectOpsHandover(programId: string, reason: string) {
    const session = await auth()
    const userRole = (session?.user as any)?.role
    const userId = (session?.user as any)?.id

    if (userRole !== 'Ops' && userRole !== 'Admin') {
        return { success: false, error: "Unauthorized - Ops role required" }
    }

    if (!reason || reason.trim().length < 10) {
        return { success: false, error: "Rejection reason must be at least 10 characters" }
    }

    try {
        const program = await prisma.programCard.update({
            where: { id: programId },
            data: {
                rejectionStatus: 'rejected_ops',
                opsRejectionReason: reason.trim(),
                rejectedBy: userId,
                rejectedAt: new Date(),
                handoverAcceptedByOps: false,
            },
            include: {
                salesOwner: true
            }
        })

        // Send email to Sales Owner
        try {
            if (program.salesOwner?.email) {
                await sendEmail({
                    to: program.salesOwner.email,
                    ...opsRejectedEmail({
                        id: program.id,
                        programName: program.programName,
                        programId: program.programId,
                        salesOwnerName: program.salesOwner.name || 'Sales Owner',
                        rejectionReason: reason.trim(),
                    })
                })
            }
        } catch (emailError) {
            console.error('Ops rejection email failed:', emailError)
        }

        revalidatePath(`/dashboard/programs/${programId}`)
        return { success: true }
    } catch (error) {
        console.error('Ops rejection error:', error)
        return { success: false, error: "Failed to reject handover" }
    }
}

/**
 * Sales resubmits a rejected program
 */
export async function resubmitProgram(programId: string) {
    const session = await auth()
    const userRole = (session?.user as any)?.role
    const userId = (session?.user as any)?.id

    // Only Sales owner or Admin can resubmit
    const program = await prisma.programCard.findUnique({
        where: { id: programId },
        include: { salesOwner: true }
    })

    if (!program) {
        return { success: false, error: "Program not found" }
    }

    if (program.salesPOCId !== userId && userRole !== 'Admin') {
        return { success: false, error: "Unauthorized - Only program owner can resubmit" }
    }

    if (!(program as any).rejectionStatus) {
        return { success: false, error: "Program is not rejected" }
    }

    try {
        const wasRejectedByFinance = (program as any).rejectionStatus === 'rejected_finance'

        await prisma.programCard.update({
            where: { id: programId },
            data: {
                rejectionStatus: null,
                rejectedBy: null,
                rejectedAt: null,
                resubmissionCount: ((program as any).resubmissionCount || 0) + 1,
                lastResubmittedAt: new Date(),
            }
        })

        // Send notification to Finance or Ops based on where it was rejected
        try {
            if (wasRejectedByFinance) {
                // Notify Finance team
                const financeUsers = await prisma.user.findMany({
                    where: { role: { in: ['Finance', 'Admin'] } }
                })
                const financeEmails = financeUsers.map(u => u.email).filter(Boolean)

                if (financeEmails.length > 0) {
                    await sendEmail({
                        to: financeEmails,
                        ...programResubmittedEmail({
                            id: program.id,
                            programName: program.programName,
                            programId: program.programId,
                            salesOwnerName: program.salesOwner?.name || 'Sales Owner',
                            resubmissionCount: ((program as any).resubmissionCount || 0) + 1,
                        })
                    })
                }
            } else {
                // Notify Ops team
                const opsUsers = await prisma.user.findMany({
                    where: { role: { in: ['Ops', 'Admin'] } }
                })
                const opsEmails = opsUsers.map(u => u.email).filter(Boolean)

                if (opsEmails.length > 0) {
                    await sendEmail({
                        to: opsEmails,
                        ...programResubmittedEmail({
                            id: program.id,
                            programName: program.programName,
                            programId: program.programId,
                            salesOwnerName: program.salesOwner?.name || 'Sales Owner',
                            resubmissionCount: ((program as any).resubmissionCount || 0) + 1,
                        })
                    })
                }
            }
        } catch (emailError) {
            console.error('Resubmission email failed:', emailError)
        }

        revalidatePath(`/dashboard/programs/${programId}`)
        return { success: true }
    } catch (error) {
        console.error('Resubmission error:', error)
        return { success: false, error: "Failed to resubmit program" }
    }
}

/**
 * Get pending approvals count and list for Finance/Ops users
 */
export async function getPendingApprovals(userRole: string) {
    try {
        let programs: any[]

        if (userRole === 'Finance' || userRole === 'Admin') {
            // Finance: Programs in Stage 1 without approval and not rejected
            programs = await prisma.programCard.findMany({
                where: {
                    currentStage: 1,
                    financeApprovalReceived: false,
                    OR: [
                        { rejectionStatus: null },
                        { rejectionStatus: { not: 'rejected_finance' } }
                    ]
                },
                include: {
                    salesOwner: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        } else if (userRole === 'Ops') {
            // Ops: Programs with Finance approval but no handover acceptance and not rejected
            programs = await prisma.programCard.findMany({
                where: {
                    financeApprovalReceived: true,
                    handoverAcceptedByOps: false,
                    currentStage: 1,
                    OR: [
                        { rejectionStatus: null },
                        { rejectionStatus: { not: 'rejected_ops' } }
                    ]
                },
                include: {
                    salesOwner: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        } else {
            programs = []
        }

        return {
            success: true,
            count: programs.length,
            programs
        }
    } catch (error) {
        console.error('Get pending approvals error:', error)
        return {
            success: false,
            count: 0,
            programs: [],
            error: "Failed to fetch pending approvals"
        }
    }
}
