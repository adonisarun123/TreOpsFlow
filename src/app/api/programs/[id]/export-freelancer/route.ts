import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { jsPDF } from "jspdf"
import path from "path"
import fs from "fs"

// Helper: Parse date string safely
function parseDateStr(program: any): string {
    if (!program.programDates) return "N/A"
    try {
        const parsed = JSON.parse(program.programDates)
        if (Array.isArray(parsed) && parsed.length > 0) {
            let dateStr = new Date(parsed[0]).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            if (parsed.length > 1) {
                dateStr += " to " + new Date(parsed[parsed.length - 1]).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            }
            return dateStr
        }
    } catch { }
    return program.programDates
}

// Helper: Get stage name
function getStageLabelForExport(stage: number): string {
    const stages: Record<number, string> = {
        1: "Tentative Handover",
        2: "Accepted Handover",
        3: "Feasibility Check & Preps",
        4: "Delivery",
        5: "Post Trip Closure",
        6: "Done",
    }
    return stages[stage] || `Stage ${stage}`
}

// Build structured data from program (shared between all formats)
function buildExportData(program: any) {
    const dateStr = parseDateStr(program)

    const sections: { title: string; items: { label: string; value: string }[] }[] = []

    // Section 1: Basic Information
    sections.push({
        title: "Basic Information",
        items: [
            { label: "Program ID", value: program.programId || "N/A" },
            { label: "Client Company", value: program.companyName || "N/A" },
            { label: "Location", value: program.location || "N/A" },
            { label: "Dates", value: dateStr },
            { label: "Participant Count", value: `${program.participantCount || program.actualParticipantCount || "N/A"} (Min: ${program.minPax || "N/A"}, Max: ${program.maxPax || "N/A"})` },
            { label: "Sales POC", value: `${program.salesOwner?.name || "N/A"} (${program.salesOwner?.email || "N/A"})` },
            { label: "Client POC", value: `${program.clientPOCName || "N/A"} (${program.clientPOCPhone || "N/A"})` },
        ],
    })

    // Section 2: Operational Details
    const opsItems: { label: string; value: string }[] = [
        { label: "Facilitators Details", value: program.facilitatorsFreelancersDetails || "N/A" },
        { label: "Ops SPOC", value: program.opsSPOCAssignedName || "N/A" },
        { label: "Activity Type", value: program.activityType || "N/A" },
        { label: "Objectives", value: program.objectives || "N/A" },
        { label: "Activities Committed", value: program.activitiesCommitted || "N/A" },
        { label: "Training Days", value: program.trainingDays?.toString() || "N/A" },
        { label: "Previous Engagement", value: program.previousEngagement ? "Yes" : "No" },
        { label: "Current Stage", value: getStageLabelForExport(program.currentStage) },
    ]
    if (program.previousEngagementNotes) {
        opsItems.splice(7, 0, { label: "Previous Engagement Notes", value: program.previousEngagementNotes })
    }
    sections.push({ title: "Operational Details", items: opsItems })

    // Section 3: Venue & Vendor Details (if any)
    if (program.venuePOC || program.specialVenueReq || program.eventVendorDetails) {
        const venueItems: { label: string; value: string }[] = []
        if (program.venuePOC) venueItems.push({ label: "Venue POC", value: program.venuePOC })
        if (program.specialVenueReq) venueItems.push({ label: "Special Venue Requirements", value: program.specialVenueReq })
        if (program.eventVendorDetails) venueItems.push({ label: "Vendor Details", value: program.eventVendorDetails })
        sections.push({ title: "Venue & Vendor Details", items: venueItems })
    }

    // Section 4: Special Instructions
    if (program.specialInstructions) {
        sections.push({
            title: "Special Instructions",
            items: [{ label: "", value: program.specialInstructions }],
        })
    }

    // Section 5: Travel Plan / Agenda
    const travelContent = (program as any).travelPlanComments || program.travelPlanDocument
    if (travelContent) {
        sections.push({
            title: "Travel Plan / Agenda",
            items: [{ label: "", value: travelContent }],
        })
    }

    // Section 6: Transportation Details
    if (program.teamTransportDetails || program.clientTransportDetails) {
        const transportItems: { label: string; value: string }[] = []
        if (program.teamTransportDetails) transportItems.push({ label: "Team Transport", value: program.teamTransportDetails })
        if (program.clientTransportDetails) transportItems.push({ label: "Client Transport", value: program.clientTransportDetails })
        sections.push({ title: "Transportation Details", items: transportItems })
    }

    // Section 7: Logistics Checklist
    if (program.logisticsChecklist) {
        sections.push({
            title: "Logistics Checklist",
            items: [{ label: "", value: typeof program.logisticsChecklist === 'boolean' ? 'Completed' : program.logisticsChecklist }],
        })
    }

    // Section 8: Delivery Execution Notes
    if (program.setupDelayDetails || program.outingComments || program.medicalIssuesComments) {
        const deliveryItems: { label: string; value: string }[] = []
        if (program.setupDelayDetails) deliveryItems.push({ label: "Setup Delay Notes", value: program.setupDelayDetails })
        if (program.outingComments) deliveryItems.push({ label: "Outing Comments", value: program.outingComments })
        if (program.medicalIssuesComments) deliveryItems.push({ label: "Medical Issues", value: program.medicalIssuesComments })
        sections.push({ title: "Delivery Execution Notes", items: deliveryItems })
    }

    return sections
}

// Generate markdown/txt content
function buildMarkdownContent(program: any, sections: ReturnType<typeof buildExportData>): string {
    let md = `# Program Details: ${program.programName}\n\n`

    for (const section of sections) {
        md += `## ${section.title}\n`
        for (const item of section.items) {
            if (item.label) {
                md += `- **${item.label}**: ${item.value}\n`
            } else {
                md += `${item.value}\n`
            }
        }
        md += "\n"
    }

    md += "---\n*Generated by Knot by Trebound*\n"
    return md
}

// Generate a well-structured PDF
function buildPDF(program: any, sections: ReturnType<typeof buildExportData>): ArrayBuffer {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const marginLeft = 20
    const marginRight = 20
    const contentWidth = pageWidth - marginLeft - marginRight
    let y = 20

    const primaryColor: [number, number, number] = [220, 53, 69]   // Trebound red accent
    const darkText: [number, number, number] = [33, 37, 41]
    const mutedText: [number, number, number] = [108, 117, 125]
    const lightBg: [number, number, number] = [248, 249, 250]
    const borderColor: [number, number, number] = [222, 226, 230]

    function checkPageBreak(neededHeight: number) {
        if (y + neededHeight > pageHeight - 25) {
            // Footer on current page
            addFooter()
            doc.addPage()
            y = 20
        }
    }

    function addFooter() {
        const footerY = pageHeight - 12
        doc.setDrawColor(...borderColor)
        doc.setLineWidth(0.3)
        doc.line(marginLeft, footerY - 4, pageWidth - marginRight, footerY - 4)
        doc.setFontSize(7)
        doc.setTextColor(...mutedText)
        doc.text("Generated by Knot by Trebound  |  Confidential - For Freelancer Use Only", pageWidth / 2, footerY, { align: "center" })
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginRight, footerY, { align: "right" })
    }

    // LOGO + TITLE HEADER
    const logoPath = path.join(process.cwd(), "public", "trebound-logo.png")
    if (fs.existsSync(logoPath)) {
        try {
            const logoData = fs.readFileSync(logoPath)
            const logoBase64 = "data:image/png;base64," + logoData.toString("base64")
            // Constrain logo to max 30mm wide, auto-height preserving aspect ratio
            const logoMaxW = 30
            const logoMaxH = 10
            // Read actual image dimensions from PNG header
            const pngW = logoData.readUInt32BE(16)
            const pngH = logoData.readUInt32BE(20)
            const aspectRatio = pngW / pngH
            let logoW = logoMaxW
            let logoH = logoW / aspectRatio
            if (logoH > logoMaxH) {
                logoH = logoMaxH
                logoW = logoH * aspectRatio
            }

            // Center logo and title vertically in a header block
            const headerBlockH = Math.max(logoH, 8) + 4
            doc.addImage(logoBase64, "PNG", marginLeft, y + 1, logoW, logoH)

            // "Program Brief" title to the right of logo, vertically centered
            doc.setFontSize(16)
            doc.setTextColor(...darkText)
            doc.setFont("helvetica", "bold")
            const titleY = y + (logoH / 2) + 1.5
            doc.text("Program Brief", marginLeft + logoW + 6, titleY)

            y += headerBlockH
        } catch {
            // If logo loading fails, fall back to text-only
            doc.setFontSize(18)
            doc.setTextColor(...darkText)
            doc.setFont("helvetica", "bold")
            doc.text("Program Brief", marginLeft, y + 6)
            y += 12
        }
    } else {
        // Fallback: no logo — just show title
        doc.setFontSize(18)
        doc.setTextColor(...darkText)
        doc.setFont("helvetica", "bold")
        doc.text("Program Brief", marginLeft, y + 6)
        y += 12
    }

    // Header bar
    doc.setFillColor(...primaryColor)
    doc.rect(0, y, pageWidth, 1.5, "F")
    y += 6

    // Subtitle
    doc.setFontSize(11)
    doc.setTextColor(...mutedText)
    doc.setFont("helvetica", "normal")
    doc.text("For Internal Reference", marginLeft, y + 4)
    y += 10

    // Program name highlight box
    doc.setFillColor(...lightBg)
    doc.roundedRect(marginLeft, y, contentWidth, 14, 2, 2, "F")
    doc.setFontSize(13)
    doc.setTextColor(...darkText)
    doc.setFont("helvetica", "bold")
    doc.text(program.programName || "Untitled Program", marginLeft + 5, y + 9)
    y += 20

    // Date & ID summary line
    const dateStr = parseDateStr(program)
    doc.setFontSize(9)
    doc.setTextColor(...mutedText)
    doc.setFont("helvetica", "normal")
    const summaryLine = `ID: ${program.programId || "N/A"}  |  ${dateStr}  |  Stage: ${getStageLabelForExport(program.currentStage)}`
    doc.text(summaryLine, marginLeft, y)
    y += 4

    // Divider
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(marginLeft, y, pageWidth - marginRight, y)
    y += 8

    // Render sections
    for (const section of sections) {
        checkPageBreak(20)

        // Section header
        doc.setFillColor(...primaryColor)
        doc.rect(marginLeft, y, 3, 6, "F")
        doc.setFontSize(12)
        doc.setTextColor(...darkText)
        doc.setFont("helvetica", "bold")
        doc.text(section.title, marginLeft + 6, y + 5)
        y += 12

        for (const item of section.items) {
            checkPageBreak(12)

            if (item.label) {
                // Label : Value row
                doc.setFontSize(9)
                doc.setTextColor(...mutedText)
                doc.setFont("helvetica", "bold")
                doc.text(item.label, marginLeft + 4, y)

                doc.setFont("helvetica", "normal")
                doc.setTextColor(...darkText)

                // Wrap long values
                const valueX = marginLeft + 4
                const valueMaxWidth = contentWidth - 8
                const valueLines = doc.splitTextToSize(item.value || "N/A", valueMaxWidth)
                doc.text(valueLines, valueX + 50, y)

                // If value is short enough to fit on one line beside label
                if (valueLines.length === 1 && doc.getTextWidth(item.label) + doc.getTextWidth(item.value || "N/A") + 55 < contentWidth) {
                    y += 6
                } else {
                    y += 5 + (valueLines.length * 4)
                }
            } else {
                // Full-width text block (no label)
                doc.setFontSize(9)
                doc.setTextColor(...darkText)
                doc.setFont("helvetica", "normal")
                const wrappedLines = doc.splitTextToSize(item.value || "", contentWidth - 8)

                for (let i = 0; i < wrappedLines.length; i++) {
                    checkPageBreak(6)
                    doc.text(wrappedLines[i], marginLeft + 4, y)
                    y += 4.5
                }
                y += 2
            }
        }

        // Section spacing
        y += 4
        doc.setDrawColor(...borderColor)
        doc.setLineWidth(0.2)
        doc.line(marginLeft, y, pageWidth - marginRight, y)
        y += 6
    }

    // Confidentiality notice
    checkPageBreak(20)
    doc.setFillColor(255, 243, 205) // light yellow
    doc.roundedRect(marginLeft, y, contentWidth, 14, 2, 2, "F")
    doc.setFontSize(8)
    doc.setTextColor(133, 100, 4)
    doc.setFont("helvetica", "bold")
    doc.text("CONFIDENTIAL", marginLeft + 5, y + 5)
    doc.setFont("helvetica", "normal")
    doc.text("This document contains operational details intended solely for internal use. DO NOT Share this document with unauthorized parties.", marginLeft + 5, y + 10)
    y += 20

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addFooter()
    }

    return doc.output("arraybuffer")
}

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

        const sections = buildExportData(program)

        // PDF Export
        if (formatParam === "pdf") {
            const pdfBuffer = buildPDF(program, sections)
            const filename = `${program.programId || programId}-freelancer-export.pdf`

            return new NextResponse(Buffer.from(pdfBuffer), {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                },
            })
        }

        // Markdown / Text Export
        const md = buildMarkdownContent(program, sections)
        const isTxt = formatParam === "txt"
        let outText = md
        if (isTxt) {
            outText = md.replace(/[*#_]/g, '') // strip basic markdown
        }

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
