import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { canProgressFromStage3 } from "@/lib/validations"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user
    const { id } = await params

    // Parse form data from request body (sent by Stage3FeasibilityForm)
    let body: any = {}
    try {
        body = await request.json()
    } catch {
        // Empty body is OK — validation will run against existing DB data
    }

    try {
        const program = await prisma.programCard.findUnique({ where: { id } })
        if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })

        // Accept programs at Stage 2 or 3 — move forward by one step
        if (program.currentStage !== 3 && program.currentStage !== 2) {
            return NextResponse.json({ error: "Program must be in Stage 2 or 3 to use this action" }, { status: 400 })
        }

        // Merge incoming form data with existing program for validation
        const merged = { ...program, ...body }
        const validation = canProgressFromStage3(merged)
        if (!validation.isValid) {
            return NextResponse.json({ error: "Cannot move forward:", details: validation.errors }, { status: 400 })
        }

        const nextStage = program.currentStage + 1

        // Save form data + advance stage atomically
        await prisma.programCard.update({
            where: { id },
            data: {
                confirmActivityAvailability: body.confirmActivityAvailability ?? program.confirmActivityAvailability,
                agendaWalkthroughDone: body.agendaWalkthroughDone ?? program.agendaWalkthroughDone,
                confirmFacilitatorsAvailability: body.confirmFacilitatorsAvailability ?? program.confirmFacilitatorsAvailability,
                facilitatorsFreelancersDetails: body.facilitatorsFreelancersDetails ?? program.facilitatorsFreelancersDetails,
                planDeliverablesValueAdds: body.planDeliverablesValueAdds ?? program.planDeliverablesValueAdds,
                transportationBlocking: body.transportationBlocking ?? program.transportationBlocking,
                teamTransportDetails: body.teamTransportDetails ?? program.teamTransportDetails,
                clientTransportDetails: body.clientTransportDetails ?? program.clientTransportDetails,
                helperBlocking: body.helperBlocking ?? program.helperBlocking,
                helperDetails: body.helperDetails ?? program.helperDetails,
                welcomeEmailChecklist: body.welcomeEmailChecklist ?? program.welcomeEmailChecklist,
                opsCashRequest: body.opsCashRequest ?? program.opsCashRequest,
                activityAreaConferenceHall: body.activityAreaConferenceHall ?? program.activityAreaConferenceHall,
                logisticsChecklist: body.logisticsChecklist ?? program.logisticsChecklist,
                logisticsListDocument: body.logisticsListDocument ?? program.logisticsListDocument,
                procurementChecklist: body.procurementChecklist ?? program.procurementChecklist,
                finalPacking: body.finalPacking ?? program.finalPacking,
                travelPlanComments: body.travelPlanComments ?? program.travelPlanComments,
                printHandoverSheet: body.printHandoverSheet ?? program.printHandoverSheet,
                printScoreSheet: body.printScoreSheet ?? program.printScoreSheet,
                printLogisticsSheet: body.printLogisticsSheet ?? program.printLogisticsSheet,
                printBlueprints: body.printBlueprints ?? program.printBlueprints,
                nearestHospitalDetails: body.nearestHospitalDetails ?? program.nearestHospitalDetails,
                feasibilityComments: body.feasibilityComments ?? program.feasibilityComments,
                currentStage: nextStage,
            },
        })

        await prisma.stageTransition.create({
            data: { programCardId: id, fromStage: program.currentStage, toStage: nextStage, transitionedBy: user.id, approvalNotes: `Moved to ${nextStage === 3 ? 'Feasibility Check & Preps' : 'Delivery'}.` }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        revalidatePath('/dashboard')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage transition error:", error)
        return NextResponse.json({ error: "Failed to transition stage" }, { status: 500 })
    }
}
