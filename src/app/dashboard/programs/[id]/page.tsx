import { getProgramById } from "@/app/actions/program"
import { notFound } from "next/navigation"
import { ProgramDetailsView } from "@/components/program-details"
import { Badge } from "@/components/ui/badge"
import { auth } from "@/auth"
import { HandoverActions } from "@/components/handover-actions"
import { RejectionFeedback } from "@/components/rejection-feedback"
import { Stage1Form } from "@/components/forms/stage1-form"
import { Stage2AcceptedForm } from "@/components/forms/stage2-accepted-form"
import { Stage3FeasibilityForm } from "@/components/forms/stage3-feasibility-form"
import { Stage4DeliveryForm } from "@/components/forms/stage4-delivery-form"
import { Stage5PostTripForm } from "@/components/forms/stage5-posttrip-form"
import { Stage6DoneView } from "@/components/forms/stage6-done-view"
import { getStageName } from "@/lib/validations"

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const program = await getProgramById(id)
    const session = await auth()

    if (!program) {
        notFound()
    }

    const userRole = (session?.user as any).role
    const userId = (session?.user as any).id
    const isOwner = program.salesPOCId === userId
    const isOpsOrAdmin = userRole === 'Ops' || userRole === 'Admin'

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{program.programName}</h2>
                    <p className="text-muted-foreground">{program.programId}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Badge className="text-sm sm:text-lg px-3 sm:px-4 py-1">
                        {getStageName(program.currentStage)}
                    </Badge>
                    <Badge variant="outline" className="text-xs sm:text-sm px-2 py-1">
                        Stage {program.currentStage} / 6
                    </Badge>
                </div>
            </div>

            {/* Rejection Feedback - Shows if program is rejected */}
            <RejectionFeedback program={program} isOwner={isOwner} />

            {/* Show Stage 1 Form for rejected programs (so Sales can edit and resubmit) */}
            {program.rejectionStatus && isOwner && program.currentStage === 1 && (
                <div className="mt-6">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                        <p className="text-sm text-blue-700 font-medium">
                            📝 Make your changes below, then click "Edit & Resubmit" above to send for approval again.
                        </p>
                    </div>
                    <Stage1Form program={program} isEdit={true} />
                </div>
            )}

            {/* Stage 1 Actions (Handover) - Only show if NOT rejected */}
            {program.currentStage === 1 && !program.rejectionStatus && (
                <HandoverActions program={program} session={session} />
            )}

            {/* Stage 2: Accepted Handover */}
            {program.currentStage === 2 && isOpsOrAdmin && (
                <div className="mt-6">
                    <Stage2AcceptedForm program={program} />
                </div>
            )}

            {/* Read-Only Stage 2 View for later stages */}
            {program.currentStage > 2 && (
                <div className="mt-6">
                    <Stage2AcceptedForm program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 3: Feasibility Check & Preps */}
            {program.currentStage === 3 && isOpsOrAdmin && (
                <div className="mt-6">
                    <Stage3FeasibilityForm program={program} />
                </div>
            )}

            {/* Read-Only Stage 3 View */}
            {program.currentStage > 3 && (
                <div className="mt-6">
                    <Stage3FeasibilityForm program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 4: Delivery */}
            {program.currentStage === 4 && isOpsOrAdmin && (
                <div className="mt-6">
                    <Stage4DeliveryForm program={program} />
                </div>
            )}

            {/* Read-Only Stage 4 View */}
            {program.currentStage > 4 && (
                <div className="mt-6">
                    <Stage4DeliveryForm program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 5: Post Trip Closure */}
            {program.currentStage === 5 && isOpsOrAdmin && (
                <div className="mt-6">
                    <Stage5PostTripForm program={program} />
                </div>
            )}

            {/* Read-Only Stage 5 View */}
            {program.currentStage > 5 && (
                <div className="mt-6">
                    <Stage5PostTripForm program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 6: Done (Archived) */}
            {program.currentStage === 6 && (
                <div className="mt-6">
                    <Stage6DoneView program={program} currentUser={session?.user} />
                </div>
            )}

            <ProgramDetailsView program={program} />
        </div>
    )
}
