"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Stage1Summary } from "./stage1-summary"
import { Stage1Form } from "@/components/forms/stage1-form"
import { Stage2AcceptedForm } from "@/components/forms/stage2-accepted-form"
import { Stage3FeasibilityForm } from "@/components/forms/stage3-feasibility-form"
import { Stage4DeliveryForm } from "@/components/forms/stage4-delivery-form"
import { Stage5PostTripForm } from "@/components/forms/stage5-posttrip-form"
import { getStageName } from "@/lib/validations"
import { StageStepper } from "./stage-stepper"
import { ExternalLink, Pencil, ChevronDown, ChevronUp, X } from "lucide-react"
import Link from "next/link"
import { FreelancerExportButton } from "@/components/freelancer-export-button"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import type { ProgramWithSalesOwner } from "@/types"

interface ProgramViewModalProps {
    program: ProgramWithSalesOwner | null
    isOpen: boolean
    onClose: () => void
    userRole?: string
    userId?: string
}

export function ProgramViewModal({ program, isOpen, onClose, userRole, userId }: ProgramViewModalProps) {
    const router = useRouter()
    const [showContextPanel, setShowContextPanel] = useState(false)
    const [editingSalesData, setEditingSalesData] = useState(false)
    const [sheetUrls, setSheetUrls] = useState<{ opsDataEntrySheetUrl?: string; tripExpenseSheetUrl?: string }>({})

    useEffect(() => {
        if (isOpen && program?.currentStage === 5) {
            fetch('/api/settings').then(r => r.json()).then(setSheetUrls).catch(() => {})
        }
    }, [isOpen, program?.currentStage])

    // Reset editing state when modal closes or program changes
    useEffect(() => {
        if (!isOpen) setEditingSalesData(false)
    }, [isOpen])

    if (!program) return null

    const stage = program.currentStage
    const isSalesOwner = userId && program.salesPOCId === userId
    const isOpsOrAdmin = userRole === 'Ops' || userRole === 'Admin'
    const isFinance = userRole === 'Finance'

    const handleSaved = () => {
        // Stay in modal — form shows its own toast
    }

    const handleStageMoved = () => {
        onClose()
        router.refresh()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setShowContextPanel(false) } }}>
            <DialogContent
                className="max-w-[100vw] sm:max-w-[90vw] md:max-w-5xl lg:max-w-6xl h-[100dvh] sm:h-[90vh] flex flex-col p-0 gap-0 w-full bg-card border-border rounded-none sm:rounded-lg"
                onInteractOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                {/* Header - Compact on mobile */}
                <DialogHeader className="px-3 py-2.5 sm:px-5 sm:py-4 border-b border-border flex-shrink-0 bg-muted/30">
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                <DialogTitle className="text-sm sm:text-lg font-semibold text-foreground truncate">
                                    {program.programName}
                                </DialogTitle>
                                <span className={`stage-badge-${stage} px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0`}>
                                    {getStageName(stage)}
                                </span>
                            </div>
                            <DialogDescription className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                                {stage >= 2 && stage <= 5 && isOpsOrAdmin
                                    ? "Edit fields and save progress, or move to the next stage when ready."
                                    : stage >= 2 && stage <= 5 && isFinance
                                        ? "View-only — Finance has approval access at Stage 1."
                                        : stage === 1
                                            ? "Awaiting Finance and Ops approval before editing."
                                            : stage === 6
                                                ? "This program has been completed and archived."
                                                : "Program details and context."
                                }
                            </DialogDescription>
                        </div>
                        <div className="flex flex-row items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <FreelancerExportButton programId={program.id} size="sm" className="h-7 sm:h-9 text-[10px] sm:text-xs" />
                            <Link href={`/dashboard/programs/${program.id}`}>
                                <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-9">
                                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span className="hidden sm:inline">Open Full Page</span>
                                    <span className="sm:hidden">Full</span>
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { onClose(); setShowContextPanel(false) }}
                                className="h-7 w-7 sm:h-9 sm:w-9 p-0 rounded-full hover:bg-muted flex-shrink-0"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                    <div className="pt-2 sm:pt-3">
                        <StageStepper currentStage={stage} compact />
                    </div>
                </DialogHeader>

                {/* Content Area */}
                <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

                    {/* Mobile: Collapsible Context Panel */}
                    <div className="md:hidden border-b border-border bg-muted/20 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowContextPanel(!showContextPanel)}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/40 transition-colors"
                        >
                            <span>Sales / Program Context</span>
                            {showContextPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {showContextPanel && (
                            <div className="max-h-[35vh] overflow-y-auto px-3 pb-3 border-t border-border/50">
                                <Stage1Summary program={program} />
                            </div>
                        )}
                    </div>

                    {/* Desktop: Left Panel (always visible) */}
                    <div className="hidden md:flex w-[35%] bg-muted/20 border-r border-border flex-col min-h-0">
                        <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] px-4 pt-3 pb-2 flex-shrink-0">
                            Sales / Program Context
                        </h4>
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            <Stage1Summary program={program} />
                        </div>
                    </div>

                    {/* Right Panel - Stage Form / Sales Edit */}
                    <div className="w-full md:w-[65%] bg-card flex flex-col min-h-0 flex-1">
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                            {/* Sales Owner: Edit Sales Data Mode */}
                            {isSalesOwner && editingSalesData && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground">Edit Sales Data</h3>
                                            {stage >= 2 && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                                    Changes will notify the Ops team
                                                </p>
                                            )}
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setEditingSalesData(false)} className="text-xs h-7">
                                            Back to Stage View
                                        </Button>
                                    </div>
                                    <Stage1Form program={program} isEdit={true} />
                                </div>
                            )}

                            {/* Normal stage view (not editing sales data) */}
                            {!editingSalesData && (
                                <>
                                    {/* Sales Owner: Show edit button at any stage */}
                                    {isSalesOwner && (
                                        <div className="mb-4 flex items-center justify-between p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                                            <div>
                                                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">You are the Sales owner</p>
                                                <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">Edit your handover details anytime</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditingSalesData(true)}
                                                className="text-xs h-7 gap-1 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                            >
                                                <Pencil className="h-3 w-3" /> Edit Sales Data
                                            </Button>
                                        </div>
                                    )}

                                    {stage === 1 && (
                                        <div className="text-center py-8 sm:py-12">
                                            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-3">
                                                <span className="text-xl sm:text-2xl">📋</span>
                                            </div>
                                            <p className="text-sm sm:text-base font-medium text-foreground">Tentative Handover</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Program context is shown in the left panel.</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground">Awaiting Finance and Ops approval.</p>
                                        </div>
                                    )}
                                    {/* Editable stage forms — Ops and Admin only */}
                                    {isOpsOrAdmin && (
                                        <>
                                            {stage === 2 && (
                                                <Stage2AcceptedForm
                                                    program={program}
                                                    onSuccess={handleStageMoved}
                                                    onSaveOnly={handleSaved}
                                                />
                                            )}
                                            {stage === 3 && (
                                                <Stage3FeasibilityForm
                                                    program={program}
                                                    onSuccess={handleStageMoved}
                                                    onSaveOnly={handleSaved}
                                                />
                                            )}
                                            {stage === 4 && (
                                                <Stage4DeliveryForm
                                                    program={program}
                                                    onSuccess={handleStageMoved}
                                                    onSaveOnly={handleSaved}
                                                />
                                            )}
                                            {stage === 5 && (
                                                <Stage5PostTripForm
                                                    program={program}
                                                    onSuccess={handleStageMoved}
                                                    onSaveOnly={handleSaved}
                                                    sheetUrls={sheetUrls}
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Read-only view for Finance (and Sales non-owner) at stages 2-5 */}
                                    {!isOpsOrAdmin && !isSalesOwner && stage >= 2 && stage <= 5 && (
                                        <div className="text-center py-8 sm:py-12">
                                            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                                                <span className="text-xl sm:text-2xl">👁️</span>
                                            </div>
                                            <p className="text-sm sm:text-base font-medium text-foreground">Stage {stage} — {getStageName(stage)}</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                                {isFinance ? 'Finance has view-only access.' : 'View-only access at this stage.'}
                                            </p>
                                            <Link href={`/dashboard/programs/${program.id}`}>
                                                <Button variant="outline" size="sm" className="mt-3 text-xs">
                                                    View Full Details
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                    {stage === 6 && (
                                        <div className="text-center py-8 sm:py-12">
                                            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3">
                                                <span className="text-xl sm:text-2xl">✅</span>
                                            </div>
                                            <p className="text-sm sm:text-base font-medium text-foreground">Program Complete</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">This program is archived in the Done stage.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
