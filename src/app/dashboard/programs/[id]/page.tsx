import { getProgramById } from "@/app/actions/program"
import { notFound } from "next/navigation"
import { ProgramDetailsView } from "@/components/program-details"
import { Badge } from "@/components/ui/badge"
import { auth } from "@/auth"
import { HandoverActions } from "@/components/handover-actions"
import { Stage2Form } from "@/components/forms/stage2-form"
import { Stage3Form } from "@/components/forms/stage3-form"
import { Stage4Form } from "@/components/forms/stage4-form"

export default async function ProgramPage({ params }: { params: { id: string } }) {
    const { id } = params
    const program = await getProgramById(id)
    const session = await auth()

    if (!program) {
        notFound()
    }

    const userRole = (session?.user as any).role

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

            {/* Stage 1 Actions (Handover) */}
            {program.currentStage === 1 && (
                <HandoverActions program={program} userRole={userRole} />
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

            {/* Stage 4 Actions (Post Delivery) */}
            {program.currentStage === 4 && (
                <div className="mt-6">
                    <Stage4Form program={program} />
                </div>
            )}

            {/* Read-Only Stage 4 (Closed) */}
            {program.currentStage > 4 && (
                <div className="space-y-6 mt-6">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Program Closed! </strong>
                        <span className="block sm:inline">This program has been completed and archived.</span>
                    </div>
                    <Stage4Form program={program} isReadOnly={true} />
                </div>
            )}

            <ProgramDetailsView program={program} />
        </div>
    )
}
