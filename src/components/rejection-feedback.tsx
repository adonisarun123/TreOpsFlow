"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { resubmitProgram } from "@/app/actions/rejection"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { showToast } from "./ui/toaster"

interface RejectionFeedbackProps {
    program: any
    isOwner: boolean
}

export function RejectionFeedback({ program, isOwner }: RejectionFeedbackProps) {
    const [isResubmitting, setIsResubmitting] = useState(false)
    const router = useRouter()

    if (!program.rejectionStatus) {
        return null
    }

    const isFinanceRejection = program.rejectionStatus === 'rejected_finance'
    const isOpsRejection = program.rejectionStatus === 'rejected_ops'

    const handleResubmit = async () => {
        if (!isOwner) {
            showToast("Only the program owner can resubmit", "error")
            return
        }

        setIsResubmitting(true)
        const result = await resubmitProgram(program.id)

        if (result.error) {
            showToast(result.error, "error")
        } else {
            showToast("Program resubmitted successfully", "success")
            router.refresh()
        }
        setIsResubmitting(false)
    }

    return (
        <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">
                {isFinanceRejection && "❌ Budget Rejected by Finance"}
                {isOpsRejection && "❌ Handover Rejected by Ops"}
            </AlertTitle>
            <AlertDescription className="mt-3 space-y-4">
                <div>
                    <p className="font-semibold mb-2">Rejection Reason:</p>
                    <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded">
                        <p className="text-sm text-red-900">
                            {isFinanceRejection && program.financeRejectionReason}
                            {isOpsRejection && program.opsRejectionReason}
                        </p>
                    </div>
                </div>

                <div>
                    <p className="font-semibold mb-2">What to do next:</p>
                    {isFinanceRejection && (
                        <ul className="text-sm space-y-1 list-disc list-inside">
                            <li>Review your budget and pricing strategy</li>
                            <li>Adjust the delivery budget or billing details</li>
                            <li>Update any relevant program information</li>
                            <li>Click "Edit & Resubmit" when ready</li>
                        </ul>
                    )}
                    {isOpsRejection && (
                        <ul className="text-sm space-y-1 list-disc list-inside">
                            <li>Discuss new dates or scope with your client</li>
                            <li>Address the concerns raised by the Ops team</li>
                            <li>Update program dates, location, or requirements</li>
                            <li>Click "Edit & Resubmit" when ready</li>
                        </ul>
                    )}
                </div>

                {program.resubmissionCount > 0 && (
                    <div className="text-sm text-gray-600">
                        <p>This program has been resubmitted {program.resubmissionCount} time(s).</p>
                    </div>
                )}

                {isOwner && (
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleResubmit}
                            disabled={isResubmitting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isResubmitting ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Resubmitting...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Edit & Resubmit
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-gray-500 flex items-center">
                            Make your changes first, then click to resubmit for approval
                        </p>
                    </div>
                )}

                {!isOwner && (
                    <p className="text-sm text-gray-600 italic">
                        Only the program owner can resubmit this program.
                    </p>
                )}
            </AlertDescription>
        </Alert>
    )
}
