import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

/**
 * Item 3: Auto-logistics list generation
 * Generates a logistics checklist based on program type, pax range, and activities
 * POST /api/programs/[id]/auto-logistics
 */

const BASE_LOGISTICS: Record<string, string[]> = {
    "Team Building": [
        "Activity kits (per team)", "Score sheets", "Props & equipment",
        "Timer / stopwatch", "Markers & pens", "Charts / flip boards",
        "Tape / adhesive", "Prizes & certificates", "First aid kit",
        "Water bottles / dispenser", "Trash bags",
    ],
    "Corporate Outing": [
        "Welcome banners / standees", "Name tags / lanyards",
        "Registration desk setup", "Group activity props",
        "Music system / speakers", "Camera / tripod",
        "First aid kit", "Water cooler / bottles", "Trash bags",
        "Meal coordination sheet",
    ],
    "Workshop": [
        "Projector + HDMI cable", "Whiteboard + markers", "Handout copies",
        "Stationery kits (per participant)", "Flipcharts",
        "Extension board", "First aid kit", "Name tags",
        "Feedback forms", "Certificates",
    ],
    "Adventure Outing": [
        "Safety harness kits", "Helmets", "Gloves",
        "Rope / carabiners", "First aid kit (enhanced)",
        "Walkie-talkies", "Emergency contact sheet",
        "Water bottles", "Energy bars / snacks",
        "Instructor briefing sheet", "Waiver forms",
    ],
    "default": [
        "Activity kits / props", "Score sheets / feedback forms",
        "Markers, pens, stationery", "Name tags / lanyards",
        "First aid kit", "Water bottles / dispenser",
        "Trash bags", "Tape / adhesive",
        "Camera / phone for recording", "Prizes / certificates",
    ],
}

// Additional items based on pax range
function getPaxExtras(pax: number): string[] {
    const extras: string[] = []
    if (pax > 50) {
        extras.push("Extra first aid kit", "Additional water supply", "Crowd control signs", "PA system / megaphone")
    }
    if (pax > 100) {
        extras.push("Portable toilet arrangement", "Multiple registration desks", "Security coordination", "Ambulance on standby")
    }
    if (pax > 20) {
        extras.push("Team division slips / color bands")
    }
    return extras
}

export async function POST(
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
                programType: true,
                maxPax: true,
                activitiesCommitted: true,
                location: true,
            },
        })

        if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })

        // Get base list by program type
        const type = program.programType || "default"
        const baseList = BASE_LOGISTICS[type] || BASE_LOGISTICS["default"]

        // Get pax-based extras
        const paxExtras = getPaxExtras(program.maxPax || 0)

        // Transport-related items
        const transportItems = [
            "Vehicle booking confirmation",
            "Driver contact details",
            "Route map / directions to venue",
        ]

        // Combine and deduplicate
        const fullList = [...new Set([...baseList, ...paxExtras, ...transportItems])]

        // Format as text
        const logisticsText = fullList.map((item, i) => `${i + 1}. [ ] ${item}`).join("\n")

        return NextResponse.json({
            success: true,
            programType: type,
            paxRange: program.maxPax,
            itemCount: fullList.length,
            logisticsList: fullList,
            logisticsText,
            message: `Generated ${fullList.length} logistics items for ${type} program`,
        })
    } catch (error) {
        console.error("Auto-logistics error:", error)
        return NextResponse.json({ error: "Failed to generate" }, { status: 500 })
    }
}
