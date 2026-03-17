import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { sendEmail, htmlWrap } from "@/lib/email"
import { verifyCronSecret } from "@/lib/cron-auth"

/**
 * Item 7: Low ZFD rating alert routing — runs daily via cron
 * Finds programs closed with ZFD rating <= 3 in the last 7 days
 * Sends alert to management/admin emails
 */
export async function GET(request: Request) {
    const authError = verifyCronSecret(request)
    if (authError) return authError

    try {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const lowRatedPrograms = await prisma.programCard.findMany({
            where: {
                currentStage: 6,
                zfdRating: { lte: 3 },
                updatedAt: { gte: sevenDaysAgo },
            },
            select: {
                programId: true,
                programName: true,
                companyName: true,
                zfdRating: true,
                zfdComments: true,
                opsOwner: { select: { name: true, email: true } },
                salesOwner: { select: { name: true, email: true } },
            },
        })

        if (lowRatedPrograms.length === 0) {
            return NextResponse.json({ success: true, message: "No low ZFD programs found", count: 0 })
        }

        // Get admin users for routing
        const admins = await prisma.user.findMany({
            where: { role: 'Admin' },
            select: { email: true, name: true },
        })

        const adminEmails = admins.map(a => a.email).filter(Boolean)

        // Build email for each low-rated program
        for (const program of lowRatedPrograms) {
            const recipients = [
                ...adminEmails,
                program.opsOwner?.email,
                program.salesOwner?.email,
            ].filter(Boolean) as string[]

            if (recipients.length === 0) continue

            const body = `
                <h3 style="color: #dc2626; margin-bottom: 12px;">⚠️ Low ZFD Rating Alert</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Program</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${program.programName} (${program.programId})</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Client</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${program.companyName || 'N/A'}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">ZFD Rating</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${program.zfdRating}/5</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Comments</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${program.zfdComments || 'No comments'}</td></tr>
                    <tr><td style="padding: 8px; font-weight: 600;">Ops Owner</td><td style="padding: 8px;">${program.opsOwner?.name || 'N/A'}</td></tr>
                </table>
                <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">This program received a ZFD rating of ${program.zfdRating}/5. Please review and take corrective action.</p>
            `

            await sendEmail({
                to: recipients,
                subject: `⚠️ Low ZFD Alert: ${program.programName} (${program.zfdRating}/5)`,
                html: htmlWrap('Low ZFD Rating Alert', body),
                text: `Low ZFD Alert: ${program.programName} - Rating: ${program.zfdRating}/5 - ${program.zfdComments || 'No comments'}`,
            })
        }

        return NextResponse.json({
            success: true,
            count: lowRatedPrograms.length,
            programs: lowRatedPrograms.map(p => ({
                programId: p.programId,
                programName: p.programName,
                zfdRating: p.zfdRating,
            })),
            message: `Sent ${lowRatedPrograms.length} low ZFD alerts`,
        })
    } catch (error) {
        console.error("ZFD alert cron error:", error)
        return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
    }
}
