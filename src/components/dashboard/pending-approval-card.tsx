"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RejectionModal } from "@/components/ui/rejection-modal"
import { approveFinance } from "@/app/actions/approval"
import { rejectFinance } from "@/app/actions/rejection"
import { showToast } from "@/components/ui/toaster"
import {
    Clock, ArrowRight, Building2, MapPin, IndianRupee, User,
    Check, X, Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PendingApprovalCardProps {
    program: any
    userRole: string
}

export function PendingApprovalCard({ program, userRole }: PendingApprovalCardProps) {
    const router = useRouter()
    const [isApproving, setIsApproving] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    const isFinanceOrAdmin = userRole === 'Finance' || userRole === 'Admin'
    const canActOnFinance = isFinanceOrAdmin && !program.financeApprovalReceived

    const createdAgo = program.createdAt
        ? formatDistanceToNow(new Date(program.createdAt), { addSuffix: true })
        : null

    // Urgency color based on age
    let urgencyColor = "bg-emerald-500"
    if (program.createdAt) {
        const daysSince = (Date.now() - new Date(program.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince > 7) urgencyColor = "bg-red-500"
        else if (daysSince > 3) urgencyColor = "bg-amber-500"
    }

    async function handleApprove() {
        setIsApproving(true)
        try {
            const result = await approveFinance(program.id)
            if (result.error) {
                showToast(result.error, "error")
            } else {
                showToast("Budget approved — program moved to Accepted Handover", "success")
                setIsDismissed(true)
                router.refresh()
            }
        } catch {
            showToast("Failed to approve budget", "error")
        } finally {
            setIsApproving(false)
        }
    }

    async function handleReject(reason: string) {
        const result = await rejectFinance(program.id, reason)
        if (result.error) {
            showToast(result.error, "error")
            throw new Error(result.error)
        } else {
            showToast("Program rejected — Sales team notified via email", "success")
            setIsDismissed(true)
            router.refresh()
        }
    }

    if (isDismissed) return null

    return (
        <>
            <div className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                <div className="flex items-stretch">
                    {/* Urgency bar */}
                    <div className={`w-1 ${urgencyColor} shrink-0`} />

                    <div className="flex-1 p-4 sm:p-5">
                        {/* Top: Program info + Review link */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h3 className="font-semibold text-foreground text-base truncate">
                                        {program.programName}
                                    </h3>
                                    <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                        {program.programId}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    {program.companyName && (
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            {program.companyName}
                                        </span>
                                    )}
                                    {program.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {program.location}
                                        </span>
                                    )}
                                    {program.deliveryBudget && (
                                        <span className="flex items-center gap-1">
                                            <IndianRupee className="h-3 w-3" />
                                            {program.deliveryBudget.toLocaleString()}
                                        </span>
                                    )}
                                    {program.salesOwner && (
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {program.salesOwner.name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                                        Stage {program.currentStage}
                                    </span>
                                    {!program.financeApprovalReceived && (
                                        <span className="stage-badge-1 px-2 py-0.5 rounded text-[11px] font-medium">
                                            Awaiting Finance
                                        </span>
                                    )}
                                    {!program.handoverAcceptedByOps && program.currentStage <= 2 && (
                                        <span className="stage-badge-5 px-2 py-0.5 rounded text-[11px] font-medium">
                                            Awaiting Ops
                                        </span>
                                    )}
                                    {createdAgo && (
                                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            Created {createdAgo}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0">
                                <Link href={`/dashboard/programs/${program.id}`}>
                                    <Button variant="outline" size="sm" className="text-xs">
                                        Review
                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Finance Action Buttons */}
                        {canActOnFinance && (
                            <div className="mt-4 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-2.5">
                                    Review the budget and take action:
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                        onClick={handleApprove}
                                        disabled={isApproving}
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                                    >
                                        {isApproving ? (
                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Check className="mr-1.5 h-3.5 w-3.5" />
                                        )}
                                        Approve Budget
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={isApproving}
                                        className="w-full sm:w-auto"
                                    >
                                        <X className="mr-1.5 h-3.5 w-3.5" />
                                        Reject Budget
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rejection Modal */}
            <RejectionModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onSubmit={handleReject}
                title="Reject Budget"
                description="This program will be returned to the Sales team for revision. Please provide a clear reason for rejection."
                placeholder="e.g., Budget insufficient, Margin too low, Pricing structure needs revision..."
            />
        </>
    )
}
