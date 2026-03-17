import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { MobileChecklist } from "./mobile-checklist"

export default async function MobileChecklistPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) redirect("/login")

    const { id } = await params

    const program = await prisma.programCard.findUnique({
        where: { id },
        select: {
            id: true,
            programId: true,
            programName: true,
            programDates: true,
            programTimings: true,
            location: true,
            companyName: true,
            minPax: true,
            maxPax: true,
            currentStage: true,
            // Stage 3 checklists
            confirmActivityAvailability: true,
            agendaWalkthroughDone: true,
            confirmFacilitatorsAvailability: true,
            planDeliverablesValueAdds: true,
            transportationBlocking: true,
            helperBlocking: true,
            welcomeEmailChecklist: true,
            opsCashRequest: true,
            activityAreaConferenceHall: true,
            logisticsChecklist: true,
            procurementChecklist: true,
            finalPacking: true,
            printHandoverSheet: true,
            printScoreSheet: true,
            printLogisticsSheet: true,
            printBlueprints: true,
            // Stage 4
            specialInstructions: true,
            packingFinalCheckBy: true,
            packingProcurementDelays: true,
            onTimeSetup: true,
            onGroundLeadGen: true,
            onGroundBD: true,
            photosVideosDriveLink: true,
            nearestHospitalDetails: true,
            teamTransportDetails: true,
            clientTransportDetails: true,
            helperDetails: true,
            activitiesCommitted: true,
        },
    })

    if (!program) redirect("/dashboard")

    return (
        <div className="min-h-screen bg-background">
            <MobileChecklist program={program} />
        </div>
    )
}
