import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const url = new URL(req.url)
        const formatParam = url.searchParams.get("format") || "md"

        const resolvedParams = await params
        const programId = resolvedParams.id
        if (!programId) {
            return new NextResponse("Missing Program ID", { status: 400 })
        }

        const program = await prisma.programCard.findUnique({
            where: { id: programId },
            include: {
                salesOwner: { select: { name: true, email: true } }
            }
        })

        if (!program) {
            return new NextResponse("Program Not Found", { status: 404 })
        }

        // Whitelist generation for freelancer data export (excluding finance info)
        let md = `# Program Details: ${program.programName}\n\n`

        md += `## Basic Information\n`
        md += `- **Program ID**: ${program.programId}\n`
        md += `- **Client Company**: ${program.companyName || "N/A"}\n`
        md += `- **Location**: ${program.location || "N/A"}\n`
        
        let dateStr = "N/A"
        if (program.programDates) {
            try {
                const parsed = JSON.parse(program.programDates)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    dateStr = new Date(parsed[0]).toLocaleDateString() + " "
                    if(parsed.length > 1) {
                         dateStr += " to " + new Date(parsed[parsed.length - 1]).toLocaleDateString()
                    }
                }
            } catch {
                dateStr = program.programDates
            }
        }
        md += `- **Dates**: ${dateStr}\n`

        md += `- **Participant Count**: ${program.participantCount || program.actualParticipantCount || "N/A"} (Min: ${program.minPax || "N/A"}, Max: ${program.maxPax || "N/A"})\n`
        md += `- **Sales POC**: ${program.salesOwner?.name || "N/A"} (${program.salesOwner?.email || "N/A"})\n`
        md += `- **Client POC**: ${program.clientPOCName || "N/A"} (${program.clientPOCPhone || "N/A"})\n`
        
        md += `\n## Operational Details\n`
        md += `- **Facilitators Details**: ${program.facilitatorsFreelancersDetails || "N/A"}\n`
        md += `- **Ops SPOC**: ${program.opsSPOCAssignedName || "N/A"}\n`
        md += `- **Activity Type**: ${program.activityType || "N/A"}\n`
        md += `- **Objectives**: ${program.objectives || "N/A"}\n`
        md += `- **Activities Committed**: ${program.activitiesCommitted || "N/A"}\n`
        md += `- **Training Days**: ${program.trainingDays || "N/A"}\n`
        md += `- **Previous Engagement**: ${program.previousEngagement ? "Yes" : "No"}\n`
        if (program.previousEngagementNotes) {
            md += `- **Previous Engagement Notes**: ${program.previousEngagementNotes}\n`
        }

        md += `- **Stage**: ${program.currentStage} (1=Tentative Handover, 2=Accepted, 3=Feasibility, 4=Delivery, 5=Post Trip, 6=Done)\n`

        if (program.venuePOC || program.specialVenueReq || program.eventVendorDetails) {
             md += `\n## Venue & Vendor Details\n`
             if (program.venuePOC) md += `- **Venue POC**: ${program.venuePOC}\n`
             if (program.specialVenueReq) md += `- **Special Venue Req**: ${program.specialVenueReq}\n`
             if (program.eventVendorDetails) md += `- **Vendor Details**: ${program.eventVendorDetails}\n`
        }

        if (program.specialInstructions) {
             md += `\n## Special Instructions\n${program.specialInstructions}\n`
        }

        if ((program as any).travelPlanComments || program.travelPlanDocument) {
            md += `\n## Travel Plan / Agenda\n${(program as any).travelPlanComments || program.travelPlanDocument}\n`
        }

        if (program.teamTransportDetails || program.clientTransportDetails) {
            md += `\n## Transportation Details\n`
            if (program.teamTransportDetails) md += `- **Team Transport**: ${program.teamTransportDetails}\n`
            if (program.clientTransportDetails) md += `- **Client Transport**: ${program.clientTransportDetails}\n`
        }

        if (program.logisticsChecklist) {
            md += `\n## Logistics Checklist\n${program.logisticsChecklist}\n`
        }
        
        if (program.setupDelayDetails || program.outingComments || program.medicalIssuesComments) {
             md += `\n## Delivery Execution Notes\n`
             if (program.setupDelayDetails) md += `- **Setup Delay Notes**: ${program.setupDelayDetails}\n`
             if (program.outingComments) md += `- **Outing Comments**: ${program.outingComments}\n`
             if (program.medicalIssuesComments) md += `- **Medical Issues**: ${program.medicalIssuesComments}\n`
        }

        md += "\n---\n*Generated by Knot by Trebound*\n"

        const isTxt = formatParam === "txt"
        let outText = md
        if (isTxt) {
            outText = md.replace(/[*#_]/g, '') // strip basic markdown
        }

        // Create the response with file attachment headers
        const response = new NextResponse(outText, { status: 200 })
        const filename = `${program.programId || programId}-freelancer-export.${isTxt ? "txt" : "md"}`
        
        response.headers.set("Content-Type", isTxt ? "text/plain; charset=utf-8" : "text/markdown; charset=utf-8")
        response.headers.set("Content-Disposition", `attachment; filename="${filename}"`)

        return response
    } catch (error) {
        console.error("Export generation error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
