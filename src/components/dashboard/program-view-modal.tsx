"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Stage1Summary } from "./stage1-summary"
import { Stage2AcceptedForm } from "@/components/forms/stage2-accepted-form"
import { Stage3FeasibilityForm } from "@/components/forms/stage3-feasibility-form"
import { Stage4DeliveryForm } from "@/components/forms/stage4-delivery-form"
import { Stage5PostTripForm } from "@/components/forms/stage5-posttrip-form"
import { getStageName } from "@/lib/validations"
import { StageStepper } from "./stage-stepper"
import { ExternalLink, Eye } from "lucide-react"
import Link from "next/link"
import { FreelancerExportButton } from "@/components/freelancer-export-button"

interface ProgramViewModalProps {
    program: any
    isOpen: boolean
    onClose: () => void
}

export function ProgramViewModal({ program, isOpen, onClose }: ProgramViewModalProps) {
    if (!program) return null

    const stage = program.currentStage

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-5xl lg:max-w-6xl h-[90vh] flex flex-col p-0 gap-0 w-full bg-card border-border">
                {/* Header */}
                <DialogHeader className="px-5 py-4 border-b border-border flex-shrink-0 bg-muted/30">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <DialogTitle className="text-lg font-semibold text-foreground">
                                    {program.programName}
                                </DialogTitle>
                                <span className={`stage-badge-${stage} px-2 py-0.5 rounded text-xs font-medium`}>
                                    {getStageName(stage)}
                                </span>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Read-only view. Use the full detail page to make edits.
                            </DialogDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <FreelancerExportButton programId={program.id} />
                            <Link href={`/dashboard/programs/${program.id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 w-full sm:w-auto">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Open Full Page
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="pt-3">
                        <StageStepper currentStage={stage} compact />
                    </div>
                </DialogHeader>

                <div className="flex flex-col md:flex-row flex-1 min-h-0">
                    {/* Left Panel */}
                    <div className="w-full md:w-[35%] bg-muted/20 border-b md:border-b-0 md:border-r border-border flex flex-col min-h-0 max-h-[40vh] md:max-h-full">
                        <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] px-4 pt-3 pb-2 flex-shrink-0">
                            Sales / Program Context
                        </h4>
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            <Stage1Summary program={program} />
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="w-full md:w-[65%] bg-card flex flex-col min-h-0 flex-1">
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            {stage === 1 && (
                                <div className="text-center py-12">
                                    <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">📋</span>
                                    </div>
                                    <p className="text-base font-medium text-foreground">Tentative Handover</p>
                                    <p className="text-sm text-muted-foreground mt-1">Program context is shown in the left panel.</p>
                                    <p className="text-sm text-muted-foreground">Awaiting Finance and Ops approval.</p>
                                </div>
                            )}
                            {stage === 2 && (
                                <Stage2AcceptedForm program={program} isReadOnly={true} />
                            )}
                            {stage === 3 && (
                                <Stage3FeasibilityForm program={program} isReadOnly={true} />
                            )}
                            {stage === 4 && (
                                <Stage4DeliveryForm program={program} isReadOnly={true} />
                            )}
                            {stage === 5 && (
                                <Stage5PostTripForm program={program} isReadOnly={true} />
                            )}
                            {stage === 6 && (
                                <div className="text-center py-12">
                                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">✅</span>
                                    </div>
                                    <p className="text-base font-medium text-foreground">Program Complete</p>
                                    <p className="text-sm text-muted-foreground mt-1">This program is archived in the Done stage.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
