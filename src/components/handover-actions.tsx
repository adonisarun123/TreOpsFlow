"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { approveFinance, acceptHandover } from "@/app/actions/approval"
import { rejectFinance, rejectOpsHandover } from "@/app/actions/rejection"
import { useRouter } from "next/navigation"
import { Loader2, Check, X } from "lucide-react"
import { showToast } from "./ui/toaster"
import { RejectionModal } from "./ui/rejection-modal"

export function HandoverActions({ program, session }: { program: any; session: any }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showFinanceRejectModal, setShowFinanceRejectModal] = useState(false)
    const [showOpsRejectModal, setShowOpsRejectModal] = useState(false)

    const userRole = session?.user?.role

    const isFinance = userRole === 'Finance' || userRole === 'Admin'
    const isOps = userRole === 'Ops' || userRole === 'Admin'
    
    // Both Finance and Ops can see their sections simultaneously
    const canApproveFinance = isFinance && !program.financeApprovalReceived
    // Ops can reject even before Finance approves (simultaneous review)
    const canRejectOps = isOps && !program.handoverAcceptedByOps

    // Finance Approval
    async function onApproveFinance() {
        setIsLoading(true)
        const result = await approveFinance(program.id)

        if (result.error) {
            showToast(result.error, "error")
        } else {
            showToast("Budget approved — program moved to Accepted Handover", "success")
            router.refresh()
        }
        setIsLoading(false)
    }

    // Finance Rejection
    async function onRejectFinance(reason: string) {
        const result = await rejectFinance(program.id, reason)

        if (result.error) {
            showToast(result.error, "error")
            throw new Error(result.error)
        } else {
            showToast("Program rejected – Sales team notified", "success")
            router.refresh()
        }
    }

    // Ops Handover Rejection (can happen even before Finance approval)
    async function onRejectHandover(reason: string) {
        const result = await rejectOpsHandover(program.id, reason)

        if (result.error) {
            showToast(result.error, "error")
            throw new Error(result.error)
        } else {
            showToast("Handover rejected – Sales team notified", "success")
            router.refresh()
        }
    }

    return (
        <div className="space-y-4">
            {/* Status Banner */}
            {program.financeApprovalReceived && (
                <div className="border p-3 rounded-md bg-green-50 text-green-800 text-sm font-medium flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Finance has approved the budget
                </div>
            )}

            {/* Finance Approval Section — shown simultaneously */}
            {canApproveFinance && (
                <div className="border p-4 rounded-md bg-blue-50">
                    <h3 className="font-semibold mb-2 text-blue-900">Finance Approval Required</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Review the budget and approve or reject this program.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={onApproveFinance}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            Approve Budget
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowFinanceRejectModal(true)}
                            disabled={isLoading}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Reject Budget
                        </Button>
                    </div>
                </div>
            )}

            {/* Ops Review Section — shown simultaneously with Finance */}
            {canRejectOps && (
                <div className="border p-4 rounded-md bg-orange-50">
                    <h3 className="font-semibold mb-2 text-orange-900">Ops Review</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Review the handover details. If any information is missing or incorrect, reject it back to Sales.
                        {!program.financeApprovalReceived && (
                            <span className="block mt-1 text-orange-700 font-medium">
                                Note: Finance approval is pending. You can reject now if info is missing.
                            </span>
                        )}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => setShowOpsRejectModal(true)}
                            disabled={isLoading}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Reject — Missing Info
                        </Button>
                    </div>
                </div>
            )}

            {/* Finance Rejection Modal */}
            <RejectionModal
                isOpen={showFinanceRejectModal}
                onClose={() => setShowFinanceRejectModal(false)}
                onSubmit={onRejectFinance}
                title="Reject Budget"
                description="This program will be returned to the Sales team for revision. Please provide a clear reason for rejection."
                placeholder="e.g., Budget insufficient, Margin too low, Pricing structure needs revision..."
            />

            {/* Ops Rejection Modal */}
            <RejectionModal
                isOpen={showOpsRejectModal}
                onClose={() => setShowOpsRejectModal(false)}
                onSubmit={onRejectHandover}
                title="Reject Handover"
                description="This program will be returned to the Sales team. Please explain what information is missing or incorrect."
                placeholder="e.g., Dates unavailable, Missing client details, Venue not feasible, Logistics issues..."
            />
        </div>
    )
}
