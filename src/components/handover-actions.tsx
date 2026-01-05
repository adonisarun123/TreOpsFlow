"use client"

import { Button } from "@/components/ui/button"
import { approveFinance, acceptHandover } from "@/app/actions/approval"
import { useState } from "react"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function HandoverActions({ program, userRole }: { program: any, userRole: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function onApproveFinance() {
        if (!confirm("Confirm budget approval?")) return
        setIsLoading(true)
        await approveFinance(program.id)
        setIsLoading(false)
    }

    async function onAcceptHandover() {
        if (!confirm("Accept handover and move to Stage 2?")) return
        setIsLoading(true)
        await acceptHandover(program.id)
        setIsLoading(false)
    }

    const canApproveFinance = (userRole === 'Finance' || userRole === 'Admin') && !program.financeApprovalReceived
    const canAcceptHandover = (userRole === 'Ops' || userRole === 'Admin') && program.financeApprovalReceived && !program.handoverAcceptedByOps

    if (!canApproveFinance && !canAcceptHandover) return null

    return (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Pending Actions</span>
            </div>
            <div className="flex gap-2">
                {canApproveFinance && (
                    <Button onClick={onApproveFinance} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Approve Budget (Finance)
                    </Button>
                )}

                {canAcceptHandover && (
                    <Button onClick={onAcceptHandover} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Accept Handover (Ops)
                    </Button>
                )}
            </div>
        </div>
    )
}
