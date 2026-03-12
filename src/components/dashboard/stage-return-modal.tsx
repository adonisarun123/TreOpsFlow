"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import { showToast } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import { getStageName } from "@/lib/validations"

interface StageReturnModalProps {
    program: any
    targetStage: number
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

export function StageReturnModal({
    program,
    targetStage,
    isOpen,
    onClose,
    onConfirm
}: StageReturnModalProps) {
    const [reason, setReason] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    if (!program) return null

    const currentStageName = getStageName(program.currentStage)
    const targetStageName = getStageName(targetStage)

    async function handleReturn() {
        if (!reason.trim()) {
            showToast("Please provide a reason for returning the program", "error")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetStage,
                    reason: reason.trim(),
                }),
            })
            const result = await res.json()

            if (result.error) {
                showToast(result.error, "error")
            } else {
                showToast(`Program returned to ${targetStageName}`, "success")
                setReason("")
                onConfirm()
            }
        } catch (error) {
            showToast("Failed to return program", "error")
        } finally {
            setIsLoading(false)
        }
    }

    function handleClose() {
        setReason("")
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-700">
                        <ArrowLeft className="h-5 w-5" />
                        Return to Previous Stage
                    </DialogTitle>
                    <DialogDescription>
                        Return <strong>{program.programName}</strong> from <strong>{currentStageName}</strong> back to <strong>{targetStageName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-800">
                            <p className="font-medium">This will move the program backward.</p>
                            <p className="mt-1">Stage {program.currentStage} ({currentStageName}) → Stage {targetStage} ({targetStageName})</p>
                            <p className="mt-1 text-xs">All existing data for the target stage will be preserved.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="return-reason" className="font-medium">
                            Reason for returning <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="return-reason"
                            placeholder="e.g., Missing information from previous stage, need to redo feasibility check, client changed requirements..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="h-28"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleReturn}
                        disabled={isLoading || !reason.trim()}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
                        Return to {targetStageName}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
