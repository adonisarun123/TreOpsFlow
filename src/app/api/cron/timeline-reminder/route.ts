import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { sendEmail, htmlWrap } from "@/lib/email"

/**
 * Item 26: Timeline reminder — runs daily via cron
 * Finds programs with programDates approaching within 3 days
 */
export async function GET(request: Request) {
    const authError = verifyCronSecret(request)
    if (authError) return authError

    try {
        // Check if notification is enabled
        const setting = await prisma.appSetting.findUnique({ where: { key: "notification_timeline_approaching" } })
        if (setting?.value === "false") {
            return NextResponse.json({ skipped: true, reason: "Notification disabled by admin" })
        }

        const now = new Date()
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

        const programs = await prisma.programCard.findMany({
            where: {
                currentStage: { in: [1, 2, 3, 4] },
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

        const nowStr = now.toISOString().split('T')[0]
        const futureStr = threeDaysFromNow.toISOString().split('T')[0]

        const approaching = programs.filter(p => {
            if (!p.programDates) return false
            try {
                let dateStr: string
                try {
                    const parsed = JSON.parse(p.programDates)
                    dateStr = Array.isArray(parsed) ? parsed[0] : p.programDates
                } catch {
                    dateStr = p.programDates
                }
                const progDate = new Date(dateStr)
                return progDate >= now && progDate <= threeDaysFromNow
            } catch { return false }
        })

        const STAGE_NAMES = ['', 'Tentative Handover', 'Accepted Handover', 'Feasibility & Preps', 'Delivery', 'Post Trip', 'Done']

        let emailsSent = 0
        for (const p of approaching) {
            const recipients = [
                p.salesOwner?.email,
                p.opsOwner?.email,
            ].filter(Boolean) as string[]

            if (recipients.length === 0) continue

            const body = `
                <h3 style="color: #f59e0b; margin-bottom: 12px;">⚡ Program Approaching — Within 3 Days</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Program</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.programName} (${p.programId})</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Location</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.location || 'N/A'}</td></tr>
                    <tr><td style="padding: 8px; font-weight: 600;">Current Stage</td><td style="padding: 8px;">${STAGE_NAMES[p.currentStage] || `Stage ${p.currentStage}`}</td></tr>
                </table>
                <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">This program date is approaching within the next 3 days. Please ensure all preparations are on track.</p>
            `

            try {
                await sendEmail({
                    to: recipients,
                    subject: `⚡ Approaching: ${p.programName} (${p.programId}) — within 3 days`,
                    html: htmlWrap('Timeline Reminder', body),
                    text: `Timeline Reminder: ${p.programName} (${p.programId}) at ${p.location || 'TBD'} is approaching within 3 days.`,
                })
                emailsSent++
            } catch (emailError) {
                console.error(`Failed to send timeline reminder for ${p.programId}:`, emailError)
            }
        }

        return NextResponse.json({
            success: true,
            count: approaching.length,
            emailsSent,
            message: `Found ${approaching.length} approaching programs, sent ${emailsSent} reminder emails`,
        })
    } catch (error) {
        console.error("Timeline reminder cron error:", error)
        return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
    }
}
