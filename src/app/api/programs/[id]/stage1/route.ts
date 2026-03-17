import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { sendEmail, htmlWrap } from "@/lib/email"

/**
 * Item 20: Stage 1 (Handover) update with email notification
 * When sales edits handover fields after submission (stage >= 2),
 * sends email to Ops with details of what changed.
 */

const TRACKED_FIELDS = [
    'programName', 'programType', 'programDates', 'programTimings',
    'location', 'minPax', 'maxPax', 'clientPOCName', 'clientPOCPhone',
    'clientPOCEmail', 'companyName', 'deliveryBudget', 'activitiesCommitted',
    'venueDetails', 'specificRequirements',
] as const

const FIELD_LABELS: Record<string, string> = {
    programName: 'Program Name',
    programType: 'Program Type',
    programDates: 'Program Dates',
    programTimings: 'Program Timings',
    location: 'Location',
    minPax: 'Min Pax',
    maxPax: 'Max Pax',
    clientPOCName: 'Client POC Name',
    clientPOCPhone: 'Client POC Phone',
    clientPOCEmail: 'Client POC Email',
    companyName: 'Company Name',
    deliveryBudget: 'Delivery Budget',
    activitiesCommitted: 'Activities Committed',
    venueDetails: 'Venue Details',
    specificRequirements: 'Specific Requirements',
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const user = session.user as any

    try {
        // Get current program to detect changes
        const current = await prisma.programCard.findUnique({
            where: { id },
            include: {
                opsOwner: { select: { name: true, email: true } },
            },
        })

        if (!current) return NextResponse.json({ error: "Program not found" }, { status: 404 })

        // Build update data
        const updateData: any = {}
        const changes: { field: string; from: string; to: string }[] = []

        for (const field of TRACKED_FIELDS) {
            if (body[field] !== undefined) {
                const oldVal = String((current as any)[field] ?? '')
                const newVal = String(body[field] ?? '')
                if (oldVal !== newVal) {
                    changes.push({
                        field: FIELD_LABELS[field] || field,
                        from: oldVal || '(empty)',
                        to: newVal || '(empty)',
                    })
                }
                updateData[field] = field === 'minPax' || field === 'maxPax'
                    ? parseInt(body[field]) || null
                    : field === 'deliveryBudget'
                        ? parseFloat(body[field]) || null
                        : body[field]
            }
        }

        // Update the program
        await prisma.programCard.update({ where: { id }, data: updateData })

        // Send email if stage >= 2 and there are changes
        if (current.currentStage >= 2 && changes.length > 0 && current.opsOwner?.email) {
            const changesRows = changes.map(c =>
                `<tr>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">${c.field}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; color: #dc2626; text-decoration: line-through;">${c.from}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; color: #059669; font-weight: 500;">${c.to}</td>
                </tr>`
            ).join('')

            const body = `
                <p style="font-size: 14px; margin-bottom: 16px;">
                    <strong>${user.name || user.email}</strong> (Sales) made changes to the handover for 
                    <strong>${current.programName}</strong> (${current.programId}).
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Field</th>
                            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Previous</th>
                            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Updated</th>
                        </tr>
                    </thead>
                    <tbody>${changesRows}</tbody>
                </table>
                <p style="font-size: 12px; color: #6b7280;">Please review the changes and update your planning accordingly.</p>
            `

            await sendEmail({
                to: current.opsOwner.email,
                subject: `📝 Handover Updated: ${current.programName} (${current.programId})`,
                html: htmlWrap('Handover Edit Notification', body),
                text: `Handover updated by ${user.name}: ${changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ')}`,
            })
        }

        revalidatePath(`/dashboard/programs/${id}`)
        return NextResponse.json({
            success: true,
            changesDetected: changes.length,
            emailSent: current.currentStage >= 2 && changes.length > 0,
        })
    } catch (error) {
        console.error("Stage 1 update error:", error)
        return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }
}
