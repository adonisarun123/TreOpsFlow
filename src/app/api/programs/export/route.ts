import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

/**
 * Item 4: Export programs as CSV
 * Query params: ?stage=1-6 (optional filter)
 * Returns CSV file download
 */
export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const stageFilter = searchParams.get('stage')

    try {
        const where: { currentStage?: number } = {}
        if (stageFilter) {
            const stage = parseInt(stageFilter)
            if (stage >= 1 && stage <= 6) where.currentStage = stage
        }

        const programs = await prisma.programCard.findMany({
            where,
            include: {
                salesOwner: { select: { name: true, email: true } },
                opsOwner: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Build CSV
        const headers = [
            'Program ID', 'Program Name', 'Company', 'Program Type',
            'Location', 'Dates', 'Min Pax', 'Max Pax',
            'Delivery Budget', 'Current Stage', 'Stage Name',
            'Sales Owner', 'Ops Owner',
            'Client POC', 'Client Email', 'Client Phone',
            'ZFD Rating', 'Created At',
        ]

        const STAGE_NAMES: Record<number, string> = {
            1: "Tentative Handover", 2: "Accepted Handover", 3: "Feasibility",
            4: "Delivery", 5: "Post Trip Closure", 6: "Done",
        }

        const rows = programs.map(p => [
            p.programId,
            p.programName,
            p.companyName || '',
            p.programType || '',
            p.location || '',
            p.programDates || '',
            p.minPax?.toString() || '',
            p.maxPax?.toString() || '',
            p.deliveryBudget?.toString() || '',
            p.currentStage.toString(),
            STAGE_NAMES[p.currentStage] || '',
            p.salesOwner?.name || '',
            p.opsOwner?.name || '',
            p.clientPOCName || '',
            p.clientPOCEmail || '',
            p.clientPOCPhone || '',
            p.zfdRating?.toString() || '',
            p.createdAt.toISOString().split('T')[0],
        ])

        const escapeCSV = (val: string) => {
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`
            }
            return val
        }

        const csv = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n')

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="treops-programs-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        })
    } catch (error) {
        console.error("Export error:", error)
        return NextResponse.json({ error: "Export failed" }, { status: 500 })
    }
}
