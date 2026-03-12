"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stage1Summary } from "./stage1-summary"
import { Stage2AcceptedForm } from "@/components/forms/stage2-accepted-form"
import { Stage3FeasibilityForm } from "@/components/forms/stage3-feasibility-form"
import { Stage4DeliveryForm } from "@/components/forms/stage4-delivery-form"
import { Stage5PostTripForm } from "@/components/forms/stage5-posttrip-form"
import { getStageName } from "@/lib/validations"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

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
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-5xl lg:max-w-6xl h-[90vh] flex flex-col p-0 gap-0 w-full">
                <DialogHeader className="px-6 py-3 border-b flex-shrink-0">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                {program.programName}
                                <Badge variant="secondary" className="text-xs">
                                    Stage {stage}: {getStageName(stage)}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs mt-1">
                                Viewing current program data (read-only). Use the full detail page to make edits.
                            </DialogDescription>
                        </div>
                        <Link href={`/dashboard/programs/${program.id}`}>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open Full Page
                            </Button>
                        </Link>
                    </div>
                </DialogHeader>

                <div className="flex flex-col md:flex-row flex-1 min-h-0">
                    {/* Left Panel: Sales / Stage 1 context */}
                    <div className="w-full md:w-[35%] bg-gray-50 border-b md:border-b-0 md:border-r flex flex-col min-h-0 max-h-[40vh] md:max-h-full">
                        <h4 className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] px-4 pt-3 pb-2 flex-shrink-0">
                            Sales / Program Context
                        </h4>
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            <Stage1Summary program={program} />
                        </div>
                    </div>

                    {/* Right Panel: Current stage data (read-only) */}
                    <div className="w-full md:w-[65%] bg-white flex flex-col min-h-0 flex-1">
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            {stage === 1 && (
                                <div className="text-center text-gray-500 py-12">
                                    <p className="text-lg font-medium">Stage 1 — Tentative Handover</p>
                                    <p className="text-sm mt-2">Program context is shown in the left panel.</p>
                                    <p className="text-sm mt-1">Awaiting Finance and Ops approval.</p>
                                </div>
                            )}

                            {stage === 2 && (
                                <Stage2AcceptedForm
                                    program={program}
                                    isReadOnly={true}
                                />
                            )}

                            {stage === 3 && (
                                <Stage3FeasibilityForm
                                    program={program}
                                    isReadOnly={true}
                                />
                            )}

                            {stage === 4 && (
                                <Stage4DeliveryForm
                                    program={program}
                                    isReadOnly={true}
                                />
                            )}

                            {stage === 5 && (
                                <Stage5PostTripForm
                                    program={program}
                                    isReadOnly={true}
                                />
                            )}

                            {stage === 6 && (
                                <div className="text-center text-gray-500 py-12">
                                    <p className="text-lg font-medium">✅ Program Complete</p>
                                    <p className="text-sm mt-2">This program is archived in the Done stage.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
