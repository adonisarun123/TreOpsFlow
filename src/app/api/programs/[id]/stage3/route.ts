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
                confirmActivityAvailability: body.confirmActivityAvailability,
                agendaWalkthroughDone: body.agendaWalkthroughDone,
                confirmFacilitatorsAvailability: body.confirmFacilitatorsAvailability,
                facilitatorsFreelancersDetails: body.facilitatorsFreelancersDetails,
                planDeliverablesValueAdds: body.planDeliverablesValueAdds,
                transportationBlocking: body.transportationBlocking,
                teamTransportDetails: body.teamTransportDetails,
                clientTransportDetails: body.clientTransportDetails,
                helperBlocking: body.helperBlocking,
                helperDetails: body.helperDetails,
                welcomeEmailChecklist: body.welcomeEmailChecklist,
                opsCashRequest: body.opsCashRequest,
                activityAreaConferenceHall: body.activityAreaConferenceHall,
                logisticsChecklist: body.logisticsChecklist,
                logisticsListDocument: body.logisticsListDocument,
                procurementChecklist: body.procurementChecklist,
                finalPacking: body.finalPacking,
                agendaDocumentStage3: body.agendaDocumentStage3,
                printHandoverSheet: body.printHandoverSheet,
                printScoreSheet: body.printScoreSheet,
                printLogisticsSheet: body.printLogisticsSheet,
                printBlueprints: body.printBlueprints,
                nearestHospitalDetails: body.nearestHospitalDetails,
                feasibilityComments: body.feasibilityComments,
            },
        })

        revalidatePath(`/dashboard/programs/${id}`)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage 3 update error:", error)
        return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }
}
