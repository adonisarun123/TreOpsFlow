import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { canProgressFromStage4 } from "@/lib/validations"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user
    const { id } = await params

    // Parse form data from request body (sent by Stage4DeliveryForm)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: Record<string, any> = {}
    try {
        body = await request.json()
    } catch {
        // Empty body is OK — validation will run against existing DB data
    }

    try {
        const program = await prisma.programCard.findUnique({ where: { id } })
        if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })

        // Accept programs at Stage 3 or 4 — move forward by one step
        if (program.currentStage !== 4 && program.currentStage !== 3) {
            return NextResponse.json({ error: "Program must be in Stage 3 or 4 to use this action" }, { status: 400 })
        }

        // Merge incoming form data with existing program for validation
        const merged = { ...program, ...body }
        const validation = canProgressFromStage4(merged)
        if (!validation.isValid) {
            return NextResponse.json({ error: "Cannot move forward:", details: validation.errors }, { status: 400 })
        }

        const nextStage = program.currentStage + 1

        // Save form data + advance stage atomically
        await prisma.programCard.update({
            where: { id },
            data: {
                specialInstructions: body.specialInstructions ?? program.specialInstructions,
                packingFinalCheckBy: body.packingFinalCheckBy ?? program.packingFinalCheckBy,
                packingProcurementDelays: body.packingProcurementDelays ?? program.packingProcurementDelays,
                onTimeSetup: body.onTimeSetup ?? program.onTimeSetup,
                setupDelayDetails: body.setupDelayDetails ?? program.setupDelayDetails,
                onGroundLeadGen: body.onGroundLeadGen ?? program.onGroundLeadGen,
                onGroundBD: body.onGroundBD ?? program.onGroundBD,
                teamActivitiesExecuted: body.teamActivitiesExecuted ?? program.teamActivitiesExecuted,
                participantCount: body.participantCount ?? program.participantCount,
                outingComments: body.outingComments ?? program.outingComments,
                medicalIssuesComments: body.medicalIssuesComments ?? program.medicalIssuesComments,
                photosVideosDriveLink: body.photosVideosDriveLink ?? program.photosVideosDriveLink,
                deliveryGeneralComment: body.deliveryGeneralComment ?? program.deliveryGeneralComment,
                currentStage: nextStage,
            },
        })

        await prisma.stageTransition.create({
            data: { programCardId: id, fromStage: program.currentStage, toStage: nextStage, transitionedBy: user.id, approvalNotes: `Moved to ${nextStage === 4 ? 'Delivery' : 'Post Trip Closure'}.` }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        revalidatePath('/dashboard')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage transition error:", error)
        return NextResponse.json({ error: "Failed to transition stage" }, { status: 500 })
    }
}
