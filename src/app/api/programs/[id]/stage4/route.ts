import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    try {
        await prisma.programCard.update({
            where: { id },
            data: {
                specialInstructions: body.specialInstructions,
                packingFinalCheckBy: body.packingFinalCheckBy,
                packingProcurementDelays: body.packingProcurementDelays,
                onTimeSetup: body.onTimeSetup,
                setupDelayDetails: body.setupDelayDetails,
                onGroundLeadGen: body.onGroundLeadGen,
                onGroundBD: body.onGroundBD,
                teamActivitiesExecuted: body.teamActivitiesExecuted,
                participantCount: body.participantCount,
                outingComments: body.outingComments,
                medicalIssuesComments: body.medicalIssuesComments,
                photosVideosUploaded: body.photosVideosUploaded,
                tripExpenseSubmitted: body.tripExpenseSubmitted,
                deliveryGeneralComment: body.deliveryGeneralComment,
            },
        })

        revalidatePath(`/dashboard/programs/${id}`)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage 4 update error:", error)
        return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }
}
