"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Stage1Summary } from "./stage1-summary"
import { Stage2AcceptedForm } from "@/components/forms/stage2-accepted-form"
import { Stage3FeasibilityForm } from "@/components/forms/stage3-feasibility-form"
import { Stage4DeliveryForm } from "@/components/forms/stage4-delivery-form"
import { Stage5PostTripForm } from "@/components/forms/stage5-posttrip-form"
import { getStageName } from "@/lib/validations"
import { StageStepper } from "./stage-stepper"
import { ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

interface StageTransitionModalProps {
    program: any
    targetStage: number
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

export function StageTransitionModal({
    program,
    targetStage,
    isOpen,
    onClose,
    onConfirm
}: StageTransitionModalProps) {
    const [sheetUrls, setSheetUrls] = useState<{ opsDataEntrySheetUrl?: string; tripExpenseSheetUrl?: string }>({})

    useEffect(() => {
        if (isOpen && program?.currentStage === 5) {
            fetch('/api/settings').then(r => r.json()).then(setSheetUrls).catch(() => {})
        }
    }, [isOpen, program?.currentStage])

    if (!program) return null

    // Always show the current stage's exit form (not the drag target's form)
    // The move button inside each form advances to the next stage
    const actualNextStage = program.currentStage + 1

    const handleStageMoved = () => {
        onConfirm()
    }

    const handleSaved = () => {
        // Stay in modal — form shows its own toast
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-5xl lg:max-w-6xl h-[90vh] flex flex-col p-0 gap-0 w-full bg-card border-border">
                {/* Header with mini stepper */}
                <DialogHeader className="px-5 py-4 border-b border-border flex-shrink-0 bg-muted/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className={`stage-badge-${program.currentStage} px-2 py-0.5 rounded text-xs font-medium`}>
                            {getStageName(program.currentStage)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span className={`stage-badge-${actualNextStage} px-2 py-0.5 rounded text-xs font-medium`}>
                            {getStageName(actualNextStage)}
                        </span>
                    </div>
                    <DialogTitle className="text-lg font-semibold text-foreground">
                        Transition: {program.programName}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Use <strong>Save Progress</strong> to save without moving stages. 
                        Use the <strong>Move</strong> button when ready to transition.
                    </DialogDescription>
                    <div className="pt-3">
                        <StageStepper currentStage={program.currentStage} compact />
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
                            {/* Show current stage's EXIT form — complete pending work before moving */}
                            {(program.currentStage === 1 || program.currentStage === 2) && (
                                <Stage2AcceptedForm
                                    program={program}
                                    onSuccess={handleStageMoved}
                                    onSaveOnly={handleSaved}
                                    isTransitioningToThisStage={true}
                                />
                            )}
                            {program.currentStage === 3 && (
                                <Stage3FeasibilityForm
                                    program={program}
                                    onSuccess={handleStageMoved}
                                    onSaveOnly={handleSaved}
                                    isTransitioningToThisStage={true}
                                />
                            )}
                            {program.currentStage === 4 && (
                                <Stage4DeliveryForm
                                    program={program}
                                    onSuccess={handleStageMoved}
                                    onSaveOnly={handleSaved}
                                    isTransitioningToThisStage={true}
                                />
                            )}
                            {program.currentStage === 5 && (
                                <Stage5PostTripForm
                                    program={program}
                                    onSuccess={handleStageMoved}
                                    onSaveOnly={handleSaved}
                                    isTransitioningToThisStage={true}
                                    sheetUrls={sheetUrls}
                                />
                            )}
                            {program.currentStage === 6 && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                        <p className="font-semibold text-lg">✅ Program Complete</p>
                                        <p className="text-sm mt-2 opacity-80">This program will be archived in the Done stage for data collection.</p>
                                    </div>
                                    <button 
                                        onClick={handleStageMoved}
                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                                    >
                                        Confirm & Archive
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
