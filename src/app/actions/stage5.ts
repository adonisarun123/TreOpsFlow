'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { programReopenedEmail } from '@/lib/email-templates'

/**
 * Reopen a closed program (Admin only)
 * Unlocks the program and returns it to Stage 4
 */
export async function reopenProgram(programId: string, justification: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Unauthorized" }
    }

    // Only admins can reopen programs
    if ((session.user as any).role !== "Admin") {
        return { error: "Only administrators can reopen archived programs" }
    }

    if (!justification || justification.length < 10) {
        return { error: "Justification required (minimum 10 characters)" }
    }

    try {
        const program = await prisma.programCard.findUnique({
            where: { id: programId },
            include: {
                salesOwner: true,
                opsOwner: true,
            }
        })

        if (!program) {
            return { error: "Program not found" }
        }

        if (program.currentStage !== 5) {
            return { error: "Only Stage 5 (closed) programs can be reopened" }
        }

        // Reopen program: unlock and return to Stage 4
        const updatedProgram = await prisma.programCard.update({
            where: { id: programId },
            data: {
                currentStage: 4,
                locked: false,
                finalNotes: program.finalNotes
                    ? `${program.finalNotes}\n\n[REOPENED by ${session.user.name} on ${new Date().toISOString()}]\nReason: ${justification}`
                    : `[REOPENED by ${session.user.name} on ${new Date().toISOString()}]\nReason: ${justification}`
            }
        })

        // Create audit trail
        await prisma.stageTransition.create({
            data: {
                programCardId: programId,
                fromStage: 5,
                toStage: 4,
                transitionedBy: (session.user as any).id || '',
                approvalNotes: `Program reopened by Admin. Justification: ${justification}`
            }
        })

        // Send email notifications
        const emailData = {
            id: program.id,
            programName: program.programName,
            programId: program.programId,
            reopenedBy: session.user.name || 'Admin',
            justification,
            clientName: program.clientPOCName || '',
            programDates: program.programDates || undefined
        }

        const emailTemplate = programReopenedEmail(emailData)

        // Send to sales owner
        if (program.salesOwner?.email) {
            await sendEmail({
                to: program.salesOwner.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html
            })
        }

        // Send to ops owner if assigned
        if (program.opsOwner?.email) {
            await sendEmail({
                to: program.opsOwner.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html
            })
        }

        console.log(`✅ Program ${programId} reopened by ${session.user.name}`)

        return { success: true, program: updatedProgram }

    } catch (error) {
        console.error('Error reopening program:', error)
        return { error: 'Failed to reopen program' }
    }
}
