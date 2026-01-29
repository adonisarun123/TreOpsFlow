'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sendEmail } from "@/lib/email"
import { programCreatedEmail, financeApprovalRequestedEmail } from "@/lib/email-templates"

/**
 * Create a new program card (Stage 1)
 * Assigns salesPOCId from current session
 */
export async function createProgram(data: any) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Unauthorized" }
    }

    const userId = (session.user as any).id

    try {
        // Generate unique program ID
        const timestamp = Date.now().toString(36)
        const random = Math.random().toString(36).substring(2, 7)
        const programId = `PRG-${timestamp}-${random}`.toUpperCase()

        const program = await prisma.programCard.create({
            data: {
                programId,
                currentStage: 1,
                salesPOCId: userId,

                // Basic Info
                programName: data.programName,
                programType: data.programType,
                programDates: data.programDates,
                programTimings: data.programTimings,
                location: data.location,
                minPax: data.minPax ? parseInt(data.minPax) : null,
                maxPax: data.maxPax ? parseInt(data.maxPax) : null,
                trainingDays: data.trainingDays ? parseInt(data.trainingDays) : null,

                // Client Details
                companyName: data.companyName,
                companyAddress: data.companyAddress,
                clientPOCName: data.clientPOCName,
                clientPOCPhone: data.clientPOCPhone,
                clientPOCEmail: data.clientPOCEmail,

                // Program Details
                previousEngagement: data.previousEngagement || false,
                previousEngagementNotes: data.previousEngagementNotes,
                activityType: data.activityType,
                activitiesCommitted: data.activitiesCommitted,
                objectives: data.objectives,
                deliveryBudget: data.deliveryBudget ? parseFloat(data.deliveryBudget) : null,
                billingDetails: data.billingDetails,
                photoVideoCommitment: data.photoVideoCommitment || false,

                // Logistics
                venuePOC: data.venuePOC,
                specialVenueReq: data.specialVenueReq,
                eventVendorDetails: data.eventVendorDetails,

                // Files
                agendaDocument: data.agendaDocument,
                objectiveDocuments: data.objectiveDocuments,
            }
        })

        // Send email notifications
        try {
            const salesOwner = await prisma.user.findUnique({ where: { id: userId } })

            if (salesOwner?.email) {
                // Notify sales owner
                await sendEmail({
                    to: salesOwner.email,
                    ...programCreatedEmail({
                        id: program.id,
                        programName: data.programName,
                        programId: program.programId,
                        salesOwnerName: salesOwner.name || 'Sales Owner',
                        clientName: data.companyName,
                        location: data.location,
                        budget: data.deliveryBudget ? parseFloat(data.deliveryBudget) : 0,
                    })
                })

                // Notify finance team
                const financeUsers = await prisma.user.findMany({
                    where: { role: { in: ['Finance', 'Admin'] } }
                })
                const financeEmails = financeUsers.map(u => u.email).filter(Boolean)

                if (financeEmails.length > 0) {
                    await sendEmail({
                        to: financeEmails,
                        ...financeApprovalRequestedEmail({
                            id: program.id,
                            programName: data.programName,
                            programId: program.programId,
                            salesOwnerName: salesOwner.name || 'Sales Owner',
                            budget: data.deliveryBudget ? parseFloat(data.deliveryBudget) : 0,
                        })
                    })
                }
            }
        } catch (emailError) {
            console.error('Email notification failed:', emailError)
            // Don't fail the whole operation if email fails
        }

        revalidatePath('/dashboard/programs')
        return { success: true, programId: program.id }

    } catch (error) {
        console.error('Create program error:', error)
        return { error: "Failed to create program" }
    }
}

/**
 * Update Stage 1 fields for existing program
 */
export async function updateStage1(id: string, data: any) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.programCard.update({
            where: { id },
            data: {
                // Basic Info
                programName: data.programName,
                programType: data.programType,
                programDates: data.programDates,
                programTimings: data.programTimings,
                location: data.location,
                minPax: data.minPax ? parseInt(data.minPax) : null,
                maxPax: data.maxPax ? parseInt(data.maxPax) : null,
                trainingDays: data.trainingDays ? parseInt(data.trainingDays) : null,

                // Client Details
                companyName: data.companyName,
                companyAddress: data.companyAddress,
                clientPOCName: data.clientPOCName,
                clientPOCPhone: data.clientPOCPhone,
                clientPOCEmail: data.clientPOCEmail,

                // Program Details
                previousEngagement: data.previousEngagement || false,
                previousEngagementNotes: data.previousEngagementNotes,
                activityType: data.activityType,
                activitiesCommitted: data.activitiesCommitted,
                objectives: data.objectives,
                deliveryBudget: data.deliveryBudget ? parseFloat(data.deliveryBudget) : null,
                billingDetails: data.billingDetails,
                photoVideoCommitment: data.photoVideoCommitment || false,

                // Logistics
                venuePOC: data.venuePOC,
                specialVenueReq: data.specialVenueReq,
                eventVendorDetails: data.eventVendorDetails,

                // Files
                agendaDocument: data.agendaDocument,
                objectiveDocuments: data.objectiveDocuments,
            }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true }

    } catch (error) {
        console.error('Update Stage 1 error:', error)
        return { error: "Failed to update program" }
    }
}
