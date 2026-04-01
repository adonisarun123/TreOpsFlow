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
import { Loader2, AlertTriangle } from "lucide-react"

interface DeleteProgramModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (reason: string) => Promise<void>
    programName: string
    programId: string
}

export function DeleteProgramModal({
    isOpen,
    onClose,
    onSubmit,
    programName,
    programId,
}: DeleteProgramModalProps) {
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError("Deletion reason is required")
            return
        }
        if (reason.trim().length < 10) {
            setError("Reason must be at least 10 characters")
            return
        }

        setError("")
        setIsSubmitting(true)

        try {
            await onSubmit(reason.trim())
            setReason("")
            onClose()
        } catch (err: unknown) {
            setError((err as Error)?.message || "Failed to delete program")
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
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Program
                    </DialogTitle>
                    <DialogDescription>
                        This will permanently delete <strong>{programName}</strong> ({programId}) and notify all team members. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="delete-reason" className="font-semibold">
                            Reason for Deletion <span className="text-red-600">*</span>
                        </Label>
                        <Textarea
                            id="delete-reason"
                            placeholder="e.g., Client cancelled, Duplicate entry, Created in error..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[120px]"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500">
                            Minimum 10 characters. All team members will be notified with this reason.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
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
                        {isSubmitting ? "Deleting..." : "Delete Program"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
