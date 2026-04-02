'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
// redirect is available if needed for future navigation flows
import { sendEmail, htmlWrap } from "@/lib/email"
import { programCreatedEmail, financeApprovalRequestedEmail } from "@/lib/email-templates"

// All Stage 1 fields with human-readable labels for change tracking emails
const STAGE1_FIELD_LABELS: Record<string, string> = {
    programName: 'Program Name',
    programType: 'Program Type',
    isMultiDayEvent: 'Multi-Day Event',
    programDates: 'Program Dates',
    programTimings: 'Program Timings',
    location: 'Location',
    minPax: 'Min Pax',
    maxPax: 'Max Pax',
    trainingDays: 'Training Days',
    companyName: 'Company Name',
    companyAddress: 'Company Address',
    clientPOCName: 'Client POC Name',
    clientPOCPhone: 'Client POC Phone',
    clientPOCEmail: 'Client POC Email',
    previousEngagement: 'Previous Engagement',
    previousEngagementNotes: 'Previous Engagement Notes',
    activityType: 'Activity Type',
    activitiesCommitted: 'Activities Committed',
    objectives: 'Objectives',
    deliveryBudget: 'Delivery Budget',
    billingDetails: 'Billing Details',
    photoVideoCommitment: 'Photo/Video Commitment',
    budgetVenue: 'Budget - Venue',
    budgetTransport: 'Budget - Transport',
    budgetActivities: 'Budget - Activities',
    budgetFood: 'Budget - Food',
    budgetMiscellaneous: 'Budget - Miscellaneous',
    budgetNotes: 'Budget Notes',
    venuePOC: 'Venue POC',
    specialVenueReq: 'Special Venue Requirements',
    eventVendorDetails: 'Event Vendor Details',
    agendaDocument: 'Agenda Document',
    objectiveDocuments: 'Objective Documents',
}

function formatFieldValue(key: string, val: unknown): string {
    if (val === null || val === undefined || val === '') return '(empty)'
    if (typeof val === 'boolean') return val ? 'Yes' : 'No'
    if (key === 'deliveryBudget' || key.startsWith('budget')) {
        const n = Number(val)
        return isNaN(n) ? String(val) : `₹${n.toLocaleString('en-IN')}`
    }
    const s = String(val)
    return s.length > 120 ? s.slice(0, 117) + '...' : s
}

/**
 * Create a new program card (Stage 1)
 * Assigns salesPOCId from current session
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProgram(data: Record<string, any>) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Unauthorized" }
    }

    const userId = (session.user as { id: string }).id

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

                // Budget Categorization
                budgetVenue: data.budgetVenue ? parseFloat(data.budgetVenue) : null,
                budgetTransport: data.budgetTransport ? parseFloat(data.budgetTransport) : null,
                budgetActivities: data.budgetActivities ? parseFloat(data.budgetActivities) : null,
                budgetFood: data.budgetFood ? parseFloat(data.budgetFood) : null,
                budgetMiscellaneous: data.budgetMiscellaneous ? parseFloat(data.budgetMiscellaneous) : null,
                budgetNotes: data.budgetNotes,

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

                // Also notify Ops team simultaneously
                const opsUsers = await prisma.user.findMany({
                    where: { role: { in: ['Ops', 'Admin'] } }
                })
                const opsEmails = opsUsers.map(u => u.email).filter(Boolean)

                if (opsEmails.length > 0) {
                    await sendEmail({
                        to: opsEmails,
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
 * Update Stage 1 (sales) fields for existing program.
 * - Ownership enforced: only the Sales owner can edit their data
 * - Change tracking: detects all modified Stage 1 fields
 * - Email notification: when stage >= 2, notifies Ops with a detailed change table
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateStage1(id: string, data: Record<string, any>) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Unauthorized" }
    }

    const userId = (session.user as { id: string; name: string; email: string }).id
    const userName = (session.user as { name: string }).name || 'Sales User'

    try {
        // Fetch current program for ownership check + change detection
        const current = await prisma.programCard.findUnique({
            where: { id },
            include: {
                opsOwner: { select: { name: true, email: true } },
            },
        })

        if (!current) return { error: "Program not found" }

        // Ownership check — only the Sales owner can edit their sales data
        if (current.salesPOCId !== userId) {
            return { error: "Only the program's Sales owner can edit sales data" }
        }

        // Build update payload (strictly Stage 1 fields only)
        const updateData = {
            programName: data.programName,
            programType: data.programType,
            programDates: data.programDates,
            programTimings: data.programTimings,
            location: data.location,
            minPax: data.minPax ? parseInt(data.minPax) : null,
            maxPax: data.maxPax ? parseInt(data.maxPax) : null,
            trainingDays: data.trainingDays ? parseInt(data.trainingDays) : null,
            companyName: data.companyName,
            companyAddress: data.companyAddress,
            clientPOCName: data.clientPOCName,
            clientPOCPhone: data.clientPOCPhone,
            clientPOCEmail: data.clientPOCEmail,
            previousEngagement: data.previousEngagement || false,
            previousEngagementNotes: data.previousEngagementNotes,
            activityType: data.activityType,
            activitiesCommitted: data.activitiesCommitted,
            objectives: data.objectives,
            deliveryBudget: data.deliveryBudget ? parseFloat(data.deliveryBudget) : null,
            billingDetails: data.billingDetails,
            photoVideoCommitment: data.photoVideoCommitment || false,
            budgetVenue: data.budgetVenue ? parseFloat(data.budgetVenue) : null,
            budgetTransport: data.budgetTransport ? parseFloat(data.budgetTransport) : null,
            budgetActivities: data.budgetActivities ? parseFloat(data.budgetActivities) : null,
            budgetFood: data.budgetFood ? parseFloat(data.budgetFood) : null,
            budgetMiscellaneous: data.budgetMiscellaneous ? parseFloat(data.budgetMiscellaneous) : null,
            budgetNotes: data.budgetNotes,
            venuePOC: data.venuePOC,
            specialVenueReq: data.specialVenueReq,
            eventVendorDetails: data.eventVendorDetails,
            agendaDocument: data.agendaDocument,
            objectiveDocuments: data.objectiveDocuments,
        }

        // Detect changes across ALL Stage 1 fields
        const changes: { field: string; from: string; to: string }[] = []
        for (const [key, label] of Object.entries(STAGE1_FIELD_LABELS)) {
            if (!(key in updateData)) continue
            const oldVal = (current as Record<string, unknown>)[key]
            const newVal = (updateData as Record<string, unknown>)[key]
            // Normalize for comparison (handle null vs undefined vs empty string)
            const oldStr = formatFieldValue(key, oldVal)
            const newStr = formatFieldValue(key, newVal)
            if (oldStr !== newStr) {
                changes.push({ field: label, from: oldStr, to: newStr })
            }
        }

        // Persist updates
        await prisma.programCard.update({ where: { id }, data: updateData })

        // Send change notification email to Ops when stage >= 2 and changes exist
        if (current.currentStage >= 2 && changes.length > 0) {
            try {
                const changesRows = changes.map(c =>
                    `<tr>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">${c.field}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; color: #dc2626; text-decoration: line-through;">${c.from}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; color: #059669; font-weight: 500;">${c.to}</td>
                    </tr>`
                ).join('')

                const emailBody = `
                    <p style="font-size: 14px; margin-bottom: 8px;">
                        <strong>${userName}</strong> (Sales) updated the sales data for
                        <strong>${current.programName}</strong> (<code>${current.programId}</code>).
                    </p>
                    <p style="font-size: 13px; color: #6b7280; margin-bottom: 16px;">
                        ${changes.length} field${changes.length > 1 ? 's' : ''} changed while program is at Stage ${current.currentStage}.
                    </p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; width: 30%;">Field</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; width: 35%;">Previous</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; width: 35%;">Updated</th>
                            </tr>
                        </thead>
                        <tbody>${changesRows}</tbody>
                    </table>
                    <p style="font-size: 12px; color: #6b7280;">Please review the changes and update your planning accordingly.</p>
                `

                // Send to assigned Ops owner if exists, otherwise all Ops users
                const recipients: string[] = []
                if (current.opsOwner?.email) {
                    recipients.push(current.opsOwner.email)
                } else {
                    const opsUsers = await prisma.user.findMany({
                        where: { role: { in: ['Ops', 'Admin'] }, active: true },
                        select: { email: true },
                    })
                    recipients.push(...opsUsers.map(u => u.email))
                }

                if (recipients.length > 0) {
                    await sendEmail({
                        to: recipients,
                        subject: `📝 Sales Data Updated: ${current.programName} (${current.programId})`,
                        html: htmlWrap('Sales Data Edit Notification', emailBody),
                        text: `Sales data updated by ${userName}: ${changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ')}`,
                    })
                }
            } catch (emailError) {
                console.error('Sales edit notification email failed:', emailError)
                // Don't fail the update if email fails
            }
        }

        revalidatePath(`/dashboard/programs/${id}`)
        return { success: true, changesDetected: changes.length }

    } catch (error) {
        console.error('Update Stage 1 error:', error)
        return { error: "Failed to update program" }
    }
}
