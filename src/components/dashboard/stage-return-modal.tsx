"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { showToast } from "@/components/ui/toaster"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getStageName } from "@/lib/validations"
import { AlertTriangle, ArrowLeft } from "lucide-react"

interface StageReturnModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    program: any
    targetStage: number
}

export function StageReturnModal({ isOpen, onClose, onConfirm, program, targetStage }: StageReturnModalProps) {
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    if (!program) return null

    async function handleReturn() {
        if (!reason.trim()) {
            showToast("Please provide a reason for returning this program.", "error")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/return`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetStage, reason }),
            })
            const data = await res.json()
            if (data.error) {
                showToast(data.error, "error")
            } else {
                showToast(`Program returned to ${getStageName(targetStage)}`, "success")
                setReason("")
                onConfirm()
                router.refresh()
            }
        } catch (err) {
            showToast("Failed to return program", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-border">
                {/* Warning header */}
                <div className="bg-orange-50 dark:bg-orange-950/30 -mx-6 -mt-6 px-6 pt-5 pb-4 border-b border-orange-200 dark:border-orange-800 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold text-orange-900 dark:text-orange-200">
                                Return to Previous Stage
                            </DialogTitle>
                            <DialogDescription className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                                This will move the program backward in the pipeline.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <DialogHeader className="pt-2">
                    <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                        <span className={`stage-badge-${program.currentStage} px-2 py-0.5 rounded text-xs font-medium`}>
                            {getStageName(program.currentStage)}
                        </span>
                        <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className={`stage-badge-${targetStage} px-2 py-0.5 rounded text-xs font-medium`}>
                            {getStageName(targetStage)}
                        </span>
                    </div>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div>
                        <Label className="text-sm font-medium">
                            Reason for returning <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why this program needs to go back..."
                            className="mt-1.5 min-h-[100px] bg-muted/30 border-border"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReturn}
                            disabled={isSubmitting || !reason.trim()}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {isSubmitting ? "Returning..." : "Confirm Return"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
