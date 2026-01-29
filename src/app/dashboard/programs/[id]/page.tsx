import { getProgramById } from "@/app/actions/program"
import { notFound } from "next/navigation"
import { ProgramDetailsView } from "@/components/program-details"
import { Badge } from "@/components/ui/badge"
import { auth } from "@/auth"
import { HandoverActions } from "@/components/handover-actions"
import { RejectionFeedback } from "@/components/rejection-feedback"
import { Stage1Form } from "@/components/forms/stage1-form"
import { Stage2Form } from "@/components/forms/stage2-form"
import { Stage3Form } from "@/components/forms/stage3-form"
import { Stage4Form } from "@/components/forms/stage4-form"
import { Stage5View } from "@/components/forms/stage5-view"

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{program.programName}</h2>
                    <p className="text-muted-foreground">{program.programId}</p>
                </div>
                <div className="flex gap-2">
                    <Badge className="text-lg px-4 py-1">Stage {program.currentStage}</Badge>
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

            {/* Stage 2 Actions (Feasibility) */}
            {program.currentStage === 2 && (userRole === 'Ops' || userRole === 'Admin') && (
                <div className="mt-6">
                    <Stage2Form program={program} />
                </div>
            )}

            {/* Read-Only Stage 2 View for others or later stages */}
            {program.currentStage > 2 && (
                <div className="mt-6">
                    <Stage2Form program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 3 Actions (Delivery) */}
            {program.currentStage === 3 && (userRole === 'Ops' || userRole === 'Admin') && (
                <div className="mt-6">
                    <Stage3Form program={program} />
                </div>
            )}

            {/* Read-Only Stage 3 View */}
            {program.currentStage > 3 && (
                <div className="mt-6">
                    <Stage3Form program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 4 Actions (Feedback & Closure) */}
            {program.currentStage === 4 && (userRole === 'Ops' || userRole === 'Admin' || userRole === 'Finance') && (
                <div className="mt-6">
                    <Stage4Form program={program} />
                </div>
            )}

            {/* Read-Only Stage 4 View for later stages */}
            {program.currentStage > 4 && (
                <div className="mt-6">
                    <Stage4Form program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 5 View (Closed/Archived Programs) */}
            {program.currentStage === 5 && (
                <div className="mt-6">
                    <Stage5View program={program} currentUser={session?.user} />
                </div>
            )}

            <ProgramDetailsView program={program} />
        </div>
    )
}
