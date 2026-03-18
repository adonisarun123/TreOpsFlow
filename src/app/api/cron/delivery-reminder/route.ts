import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { sendEmail, htmlWrap } from "@/lib/email"

/**
 * Item 5: Delivery day reminder — runs daily via cron
 * Finds programs with programDates = tomorrow and currentStage in [3,4]
 * Sends reminder emails to Sales and Ops owners.
 */
export async function GET(request: Request) {
    const authError = verifyCronSecret(request)
    if (authError) return authError

    try {
        // Check if notification is enabled
        const setting = await prisma.appSetting.findUnique({ where: { key: "notification_delivery_reminder" } })
        if (setting?.value === "false") {
            return NextResponse.json({ skipped: true, reason: "Notification disabled by admin" })
        }

        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        const programs = await prisma.programCard.findMany({
            where: {
                currentStage: { in: [3, 4] },
            },
            select: {
                id: true,
                programId: true,
                programName: true,
                programDates: true,
                location: true,
                currentStage: true,
                salesOwner: { select: { name: true, email: true } },
                opsOwner: { select: { name: true, email: true } },
            },
        })

        const tomorrowStr = tomorrow.toISOString().split('T')[0]
        const upcomingPrograms = programs.filter(p => {
            if (!p.programDates) return false
            return p.programDates.includes(tomorrowStr)
        })

        let emailsSent = 0
        for (const p of upcomingPrograms) {
            const recipients = [
                p.salesOwner?.email,
                p.opsOwner?.email,
            ].filter(Boolean) as string[]

            if (recipients.length === 0) continue

            const stageName = p.currentStage === 3 ? 'Feasibility & Preps' : 'Delivery'
            const body = `
                <h3 style="color: #f59e0b; margin-bottom: 12px;">📅 Delivery Tomorrow Reminder</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Program</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.programName} (${p.programId})</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Location</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.location || 'N/A'}</td></tr>
                    <tr><td style="padding: 8px; font-weight: 600;">Current Stage</td><td style="padding: 8px;">${stageName} (Stage ${p.currentStage})</td></tr>
                </table>
                <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">This program is scheduled for delivery tomorrow. Please ensure all preparations are complete.</p>
            `

            try {
                await sendEmail({
                    to: recipients,
                    subject: `📅 Delivery Tomorrow: ${p.programName} (${p.programId})`,
                    html: htmlWrap('Delivery Reminder', body),
                    text: `Delivery Tomorrow: ${p.programName} (${p.programId}) at ${p.location || 'TBD'}`,
                })
                emailsSent++
            } catch (emailError) {
                console.error(`Failed to send delivery reminder for ${p.programId}:`, emailError)
            }
        }

        return NextResponse.json({
            success: true,
            remindersCount: upcomingPrograms.length,
            emailsSent,
            message: `Found ${upcomingPrograms.length} programs, sent ${emailsSent} reminder emails`,
        })
    } catch (error) {
        console.error("Delivery reminder cron error:", error)
        return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
    }
}
