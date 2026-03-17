import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

/**
 * Item 27: Helper PDF — generates a simple text summary for on-ground helpers
 * Limited data: program name, date, location, pax, activities, 
 * special instructions, nearest hospital, helper details
 * Returns plain text (frontend can use window.print() for PDF)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    try {
        const program = await prisma.programCard.findUnique({
            where: { id },
            select: {
                programId: true,
                programName: true,
                programDates: true,
                programTimings: true,
                location: true,
                minPax: true,
                maxPax: true,
                activitiesCommitted: true,
                specialInstructions: true,
                nearestHospitalDetails: true,
                helperDetails: true,
                teamTransportDetails: true,
                clientTransportDetails: true,
                companyName: true,
                clientPOCName: true,
                clientPOCPhone: true,
            },
        })

        if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })

        // Build printable summary
        const lines = [
            `═══════════════════════════════════════`,
            `  TREBOUND OPS — ON-GROUND HELPER SHEET`,
            `═══════════════════════════════════════`,
            ``,
            `Program: ${program.programName}`,
            `ID:      ${program.programId}`,
            `Client:  ${program.companyName || 'N/A'}`,
            `Date:    ${program.programDates || 'N/A'}`,
            `Timing:  ${program.programTimings || 'N/A'}`,
            `Location: ${program.location || 'N/A'}`,
            `Pax:     ${program.minPax || '?'} - ${program.maxPax || '?'}`,
            ``,
            `─── CLIENT POC ───`,
            `Name:  ${program.clientPOCName || 'N/A'}`,
            `Phone: ${program.clientPOCPhone || 'N/A'}`,
            ``,
            `─── ACTIVITIES ───`,
            program.activitiesCommitted || 'No activities listed',
            ``,
            `─── SPECIAL INSTRUCTIONS ───`,
            program.specialInstructions || 'None',
            ``,
            `─── TRANSPORT ───`,
            `Team: ${program.teamTransportDetails || 'N/A'}`,
            `Client: ${program.clientTransportDetails || 'N/A'}`,
            ``,
            `─── HELPERS ───`,
            program.helperDetails || 'No helper details',
            ``,
            `─── NEAREST HOSPITAL ───`,
            program.nearestHospitalDetails || 'Not specified',
            ``,
            `═══════════════════════════════════════`,
            `Generated: ${new Date().toLocaleString('en-IN')}`,
        ]

        return new NextResponse(lines.join('\n'), {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="helper-sheet-${program.programId}.txt"`,
            },
        })
    } catch (error) {
        console.error("Helper PDF error:", error)
        return NextResponse.json({ error: "Failed to generate" }, { status: 500 })
    }
}
