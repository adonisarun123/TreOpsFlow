'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"
import { programClosedEmail } from "@/lib/email-templates"
import { z } from "zod"

export async function updateStage4(id: string, data: any) {
    const session = await auth()

    // Who can edit? Ops/Admin/Sales (Sales might enter feedback too, but let's stick to Ops for now as they are the owners until close)
    if (!session) return { error: "Unauthorized" }

    try {
        await prisma.programCard.update({
            where: { id },
            data: {
                npsScore: data.npsScore,
                clientFeedback: data.clientFeedback,
                finalInvoiceSubmitted: data.finalInvoiceSubmitted,
                vendorPaymentsClear: data.vendorPaymentsClear,
                googleReviewLink: data.googleReviewLink,
                videoTestimonialFile: data.videoTestimonialFile,
                opsDataManagerLink: data.opsDataManagerLink,
                zfdRating: data.zfdRating,
                zfdComments: data.zfdComments,
                expensesBillsSubmitted: data.expensesBillsSubmitted,
                opsDataManagerUpdated: data.opsDataManagerUpdated,
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
    const userId = (session?.user as any).id

    // Only Admin or "Finance" should technically close, but sticking to Ops flow as per previous stages, or maybe add Finance check.
    // For simplicity: Ops/Admin can close if criteria met.
    if (userRole !== 'Ops' && userRole !== 'Admin') return { error: "Unauthorized" }

    const program = await prisma.programCard.findUnique({ where: { id } })

    if (!program) return { error: "Program not found" }

    // Stage 4 → Stage 5 Exit Criteria
    const errors: string[] = []

    // ZFD Rating is MANDATORY (not NPS)
    if (program.zfdRating === null || program.zfdRating === undefined) {
        errors.push("ZFD rating is required (1-5)")
    } else if (program.zfdRating < 1 || program.zfdRating > 5) {
        errors.push("ZFD rating must be between 1 and 5")
    } else if (program.zfdRating <= 3 && (!program.zfdComments || program.zfdComments.length < 10)) {
        errors.push("Comments mandatory for ratings ≤3 (minimum 10 characters)")
    }

    if (!program.expensesBillsSubmitted) errors.push("Expenses must be submitted")
    if (!program.opsDataManagerUpdated) errors.push("Ops data must be updated")

    if (errors.length > 0) {
        return { error: "Cannot close program", details: errors }
    }

    try {
        const updatedProgram = await prisma.programCard.update({
            where: { id },
            data: {
                currentStage: 5,
                locked: true, // Stage 5 read-only enforcement
                closedAt: new Date(),
                closedBy: userId
            },
            include: {
                salesOwner: true,
                opsOwner: true
            }
        })

        // Send closure emails to all stakeholders
        try {
            const recipients: string[] = []
            if (updatedProgram.salesOwner?.email) recipients.push(updatedProgram.salesOwner.email)
            if (updatedProgram.opsOwner?.email) recipients.push(updatedProgram.opsOwner.email)

            // Add finance team
            const financeUsers = await prisma.user.findMany({
                where: { role: { in: ['Finance', 'Admin'] } }
            })
            financeUsers.forEach(u => {
                if (u.email && !recipients.includes(u.email)) {
                    recipients.push(u.email)
                }
            })

            if (recipients.length > 0) {
                await sendEmail({
                    to: recipients,
                    ...programClosedEmail({
                        id: updatedProgram.id,
                        programName: updatedProgram.programName,
                        programId: updatedProgram.programId,
                        clientName: updatedProgram.companyName || 'Client',
                        zfdRating: updatedProgram.zfdRating || 0,
                    })
                })
            }
        } catch (emailError) {
            console.error('Program closure email failed:', emailError)
        }

        await prisma.stageTransition.create({
            data: {
                programCardId: id,
                fromStage: 4,
                toStage: 5,
                transitionedBy: (session?.user as any).id,
                approvalNotes: `Program Closed. ZFD Rating: ${program.zfdRating}/5`
            }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }
    } catch (e) {
        return { error: "Closure failed" }
    }
}
