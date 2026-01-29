"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"

interface RejectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (reason: string) => Promise<void>
    title: string
    description: string
    placeholder: string
}

export function RejectionModal({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    placeholder
}: RejectionModalProps) {
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async () => {
        // Validation
        if (!reason.trim()) {
            setError("Rejection reason is required")
            return
        }

        if (reason.trim().length < 10) {
            setError("Rejection reason must be at least 10 characters")
            return
        }

        setError("")
        setIsSubmitting(true)

        try {
            await onSubmit(reason.trim())
            // Reset and close on success
            setReason("")
            onClose()
        } catch (err: any) {
            setError(err.message || "Failed to submit rejection")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (!isSubmitting) {
            setReason("")
            setError("")
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600">{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="rejection-reason" className="font-semibold">
                            Rejection Reason <span className="text-red-600">*</span>
                        </Label>
                        <Textarea
                            id="rejection-reason"
                            placeholder={placeholder}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[120px]"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500">
                            Minimum 10 characters. Be specific about why you're rejecting.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
