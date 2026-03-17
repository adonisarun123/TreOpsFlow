import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { sendEmail, htmlWrap } from "@/lib/email"

/**
 * Item 6: Expense sheet overdue alerts — runs daily via cron
 * Finds programs at Stage 5 where tripExpensesBillsSubmittedToFinance=false
 * and program date is > 7 days ago
 */
export async function GET(request: Request) {
    const authError = verifyCronSecret(request)
    if (authError) return authError

    try {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const overduePrograms = await prisma.programCard.findMany({
            where: {
                currentStage: 5,
                tripExpensesBillsSubmittedToFinance: false,
            },
            select: {
                id: true,
                programId: true,
                programName: true,
                programDates: true,
                currentStage: true,
                opsOwner: { select: { name: true, email: true } },
            },
        })

        // Filter: only programs where the program date is > 7 days ago
        const overdueStr = sevenDaysAgo.toISOString().split('T')[0]
        const filtered = overduePrograms.filter(p => {
            if (!p.programDates) return true // No date = overdue by default
            try {
                const parsed = JSON.parse(p.programDates)
                const dateStr = Array.isArray(parsed) ? parsed[0] : p.programDates
                return new Date(dateStr) < sevenDaysAgo
            } catch {
                try { return new Date(p.programDates) < sevenDaysAgo } catch { return true }
            }
        })

        let emailsSent = 0
        for (const p of filtered) {
            const recipients = [p.opsOwner?.email].filter(Boolean) as string[]
            if (recipients.length === 0) continue

            const body = `
                <h3 style="color: #dc2626; margin-bottom: 12px;">⏰ Expense Sheet Overdue</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Program</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.programName} (${p.programId})</td></tr>
                    <tr><td style="padding: 8px; font-weight: 600;">Ops Owner</td><td style="padding: 8px;">${p.opsOwner?.name || 'N/A'}</td></tr>
                </table>
                <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">The expense sheet for this program has not been submitted to Finance and is overdue (>7 days since program date). Please submit it as soon as possible.</p>
            `

            try {
                await sendEmail({
                    to: recipients,
                    subject: `⏰ Expense Overdue: ${p.programName} (${p.programId})`,
                    html: htmlWrap('Expense Sheet Overdue', body),
                    text: `Expense Overdue: ${p.programName} (${p.programId}) - Please submit expense sheet to Finance.`,
                })
                emailsSent++
            } catch (emailError) {
                console.error(`Failed to send expense overdue email for ${p.programId}:`, emailError)
            }
        }

        return NextResponse.json({
            success: true,
            overdueCount: filtered.length,
            emailsSent,
            message: `Found ${filtered.length} overdue programs, sent ${emailsSent} alert emails`,
        })
    } catch (error) {
        console.error("Expense overdue cron error:", error)
        return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
    }
}
