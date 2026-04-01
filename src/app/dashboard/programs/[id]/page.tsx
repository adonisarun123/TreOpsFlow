import { getProgramById } from "@/app/actions/program"
import { notFound } from "next/navigation"
import { ProgramDetailsView } from "@/components/program-details"
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
import { StageStepper } from "@/components/dashboard/stage-stepper"
import { ArrowLeft, Building2, MapPin, CalendarIcon, User } from "lucide-react"
import Link from "next/link"
// date-fns format available if needed
import { formatProgramDate } from "@/lib/date-utils"
import { FreelancerExportButton } from "@/components/freelancer-export-button"
import { getAppSettings } from "@/app/actions/settings"

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const program = await getProgramById(id)
    const session = await auth()

    // Fetch sheet URLs for Stage 5 form
    const settings = await getAppSettings()
    const settingsMap = Object.fromEntries((settings as { key: string; value: string }[]).map((s) => [s.key, s.value]))
    const sheetUrls = {
        opsDataEntrySheetUrl: settingsMap['opsDataEntrySheetUrl'] || '',
        tripExpenseSheetUrl: settingsMap['tripExpenseSheetUrl'] || '',
    }

    if (!program) {
        notFound()
    }

    const userRole = (session?.user as { role: string }).role
    const userId = (session?.user as { id: string }).id
    const isOwner = program.salesPOCId === userId
    const isOpsOrAdmin = userRole === 'Ops' || userRole === 'Admin'

    // Parse date for display (handles single dates, ranges, and legacy formats)
    const displayDate = formatProgramDate(program.programDates)

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Back button */}
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Link>

            {/* Header card with stepper */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Program info */}
                <div className="p-5 pb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{program.programName}</h2>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{program.programId}</span>
                                {program.companyName && (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3.5 w-3.5" />
                                        {program.companyName}
                                    </span>
                                )}
                                {program.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {program.location}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    {displayDate}
                                </span>
                                {program.salesOwner?.name && (
                                    <span className="flex items-center gap-1">
                                        <User className="h-3.5 w-3.5" />
                                        {program.salesOwner.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                            <span className={`stage-badge-${program.currentStage} px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold`}>
                                {getStageName(program.currentStage)}
                            </span>
                            <FreelancerExportButton programId={program.id} />
                        </div>
                    </div>
                </div>

                {/* Stage stepper */}
                <div className="px-5 pb-5 pt-1">
                    <StageStepper currentStage={program.currentStage} />
                </div>
            </div>

            {/* Rejection Feedback */}
            <RejectionFeedback program={program} isOwner={isOwner} />

            {/* Stage 1 Form — editable for program owner (Sales) */}
            {isOwner && program.currentStage === 1 && (
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    {program.rejectionStatus && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 p-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                📝 Make your changes below, then click &quot;Edit &amp; Resubmit&quot; above to send for approval again.
                            </p>
                        </div>
                    )}
                    <div className="p-5">
                        <Stage1Form program={program} isEdit={true} />
                    </div>
                </div>
            )}

            {/* Stage 1 Actions (Finance/Ops approval) — hidden from program owner */}
            {program.currentStage === 1 && !program.rejectionStatus && !isOwner && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-1">
                    <HandoverActions program={program} session={session} />
                </div>
            )}

            {/* Stage 2: Accepted Handover */}
            {program.currentStage === 2 && isOpsOrAdmin && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Accepted Handover</h3>
                    <Stage2AcceptedForm program={program} />
                </div>
            )}

            {/* Read-Only Stage 2 */}
            {program.currentStage > 2 && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-2 opacity-80">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Accepted Handover <span className="text-xs normal-case font-normal">(completed)</span></h3>
                    <Stage2AcceptedForm program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 3: Feasibility */}
            {program.currentStage === 3 && isOpsOrAdmin && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Feasibility Check & Preps</h3>
                    <Stage3FeasibilityForm program={program} />
                </div>
            )}

            {program.currentStage > 3 && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-3 opacity-80">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Feasibility Check & Preps <span className="text-xs normal-case font-normal">(completed)</span></h3>
                    <Stage3FeasibilityForm program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 4: Delivery */}
            {program.currentStage === 4 && isOpsOrAdmin && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Delivery</h3>
                    <Stage4DeliveryForm program={program} />
                </div>
            )}

            {program.currentStage > 4 && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-4 opacity-80">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Delivery <span className="text-xs normal-case font-normal">(completed)</span></h3>
                    <Stage4DeliveryForm program={program} isReadOnly={true} />
                </div>
            )}

            {/* Stage 5: Post Trip Closure */}
            {program.currentStage === 5 && isOpsOrAdmin && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Post Trip Closure</h3>
                    <Stage5PostTripForm program={program} sheetUrls={sheetUrls} />
                </div>
            )}

            {program.currentStage > 5 && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-5 opacity-80">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Post Trip Closure <span className="text-xs normal-case font-normal">(completed)</span></h3>
                    <Stage5PostTripForm program={program} isReadOnly={true} sheetUrls={sheetUrls} />
                </div>
            )}

            {/* Stage 6: Done */}
            {program.currentStage === 6 && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 stage-accent-6">
                    <Stage6DoneView program={program} currentUser={session?.user} />
                </div>
            )}

            {/* Program details (all raw data) */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Full Program Details</h3>
                <ProgramDetailsView program={program} />
            </div>
        </div>
    )
}
