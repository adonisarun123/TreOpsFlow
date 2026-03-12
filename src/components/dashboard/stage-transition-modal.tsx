"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Stage1Summary } from "./stage1-summary"
import { Stage2AcceptedForm } from "@/components/forms/stage2-accepted-form"
import { Stage3FeasibilityForm } from "@/components/forms/stage3-feasibility-form"
import { Stage4DeliveryForm } from "@/components/forms/stage4-delivery-form"
import { Stage5PostTripForm } from "@/components/forms/stage5-posttrip-form"
import { getStageName } from "@/lib/validations"

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
    if (!program) return null

    const getStageTitle = (stage: number) => {
        return `Move to: ${getStageName(stage)}`
    }

    const handleStageMoved = () => {
        onConfirm()
    }

    const handleSaved = () => {
        // Stay in modal — form shows its own toast
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-5xl lg:max-w-6xl h-[90vh] flex flex-col p-0 gap-0 w-full">
                <DialogHeader className="px-6 py-3 border-b flex-shrink-0">
                    <DialogTitle>{getStageTitle(targetStage)}</DialogTitle>
                    <DialogDescription className="text-xs">
                        Use <strong>Save Progress</strong> to save without moving stages. 
                        Use the <strong>Move</strong> button when ready to transition <strong>{program.programName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col md:flex-row flex-1 min-h-0">
                    {/* Left Panel: Program Context — fully scrollable */}
                    <div className="w-full md:w-[35%] bg-gray-50 border-b md:border-b-0 md:border-r flex flex-col min-h-0 max-h-[40vh] md:max-h-full">
                        <h4 className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] px-4 pt-3 pb-2 flex-shrink-0">
                            Sales / Program Context
                        </h4>
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            <Stage1Summary program={program} />
                        </div>
                    </div>

                    {/* Right Panel: Stage Form — fully scrollable */}
                    <div className="w-full md:w-[65%] bg-white flex flex-col min-h-0 flex-1">
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            {targetStage === 2 && (
                                <Stage2AcceptedForm 
                                    program={program} 
                                    onSuccess={handleStageMoved}
                                    onSaveOnly={handleSaved}
                                    isTransitioningToThisStage={true}
                                />
                            )}

                            {targetStage === 3 && (
                                <Stage3FeasibilityForm 
                                    program={program} 
                                    onSuccess={handleStageMoved}
                                    onSaveOnly={handleSaved}
                                    isTransitioningToThisStage={true}
                                />
                            )}

                            {targetStage === 4 && (
                                <Stage4DeliveryForm 
                                    program={program} 
                                    onSuccess={handleStageMoved}
                                    onSaveOnly={handleSaved}
                                    isTransitioningToThisStage={true}
                                />
                            )}

                            {targetStage === 5 && (
                                <Stage5PostTripForm 
                                    program={program} 
                                    onSuccess={handleStageMoved}
                                    onSaveOnly={handleSaved}
                                    isTransitioningToThisStage={true}
                                />
                            )}

                            {targetStage === 6 && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                                    <div className="p-4 bg-green-100 text-green-800 rounded-md">
                                        <p className="font-semibold">✅ Program Complete</p>
                                        <p className="text-sm mt-2">This program will be archived in the Done stage for data collection.</p>
                                    </div>
                                    <button 
                                        onClick={handleStageMoved}
                                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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
