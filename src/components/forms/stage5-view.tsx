"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Archive, Unlock, Calendar, User } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { reopenProgram } from "@/app/actions/stage5"
import { useRouter } from "next/navigation"
import { showToast } from "@/components/ui/toaster"
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

interface Stage5ViewProps {
    program: any
    currentUser: any
}

export function Stage5View({ program, currentUser }: Stage5ViewProps) {
    const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false)
    const [reopenJustification, setReopenJustification] = useState("")
    const [isReopening, setIsReopening] = useState(false)
    const router = useRouter()

    const isAdmin = currentUser?.role === "Admin"

    async function handleReopen() {
        if (!reopenJustification || reopenJustification.length < 10) {
            showToast("Please provide a justification (minimum 10 characters)", "error")
            return
        }

        setIsReopening(true)
        const result = await reopenProgram(program.id, reopenJustification)

        if (result.error) {
            showToast(`Error: ${result.error}`, "error")
        } else {
            showToast("Program reopened successfully", "success")
            setIsReopenDialogOpen(false)
            router.refresh()
        }
        setIsReopening(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border p-6 rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Archive className="h-8 w-8 text-gray-600" />
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                                Stage 5: Done
                                <Badge variant="secondary" className="ml-2">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Archived
                                </Badge>
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                This program has been completed and archived
                            </p>
                        </div>
                    </div>

                    {isAdmin && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setIsReopenDialogOpen(true)}
                        >
                            <Unlock className="h-4 w-4 mr-2" />
                            Reopen Program
                        </Button>
                    )}
                </div>
            </div>

            {/* Closure Information */}
            <div className="border p-6 rounded-md bg-white">
                <h4 className="font-semibold text-lg mb-4 text-gray-800">Closure Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Closed At:</span>
                        </div>
                        <p className="text-base pl-6">
                            {program.closedAt
                                ? format(new Date(program.closedAt), "PPP 'at' p")
                                : "N/A"}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Closed By:</span>
                        </div>
                        <p className="text-base pl-6">
                            {program.closedBy || "N/A"}
                        </p>
                    </div>
                </div>

                {program.finalNotes && (
                    <div className="mt-4 pt-4 border-t">
                        <h5 className="font-medium text-sm text-gray-600 mb-2">Final Notes:</h5>
                        <p className="text-base text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                            {program.finalNotes}
                        </p>
                    </div>
                )}
            </div>

            {/* Program Summary - Read-Only View */}
            <div className="border p-6 rounded-md bg-white">
                <h4 className="font-semibold text-lg mb-4 text-gray-800">Program Summary</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-gray-600">Program Name:</span>
                            <p className="text-base mt-1">{program.programName}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">Program Type:</span>
                            <p className="text-base mt-1">{program.programType}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">Location:</span>
                            <p className="text-base mt-1">{program.location}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">Program Dates:</span>
                            <p className="text-base mt-1">{program.programDates || "N/A"}</p>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-gray-600">ZFD Rating:</span>
                            <p className="text-base mt-1 font-semibold">
                                {program.zfdRating ? `${program.zfdRating}/5` : "N/A"}
                                {program.zfdRating >= 4 && " ⭐"}
                            </p>
                        </div>
                        {program.npsScore !== null && program.npsScore !== undefined && (
                            <div>
                                <span className="text-sm font-medium text-gray-600">NPS Score:</span>
                                <p className="text-base mt-1">{program.npsScore}/10</p>
                            </div>
                        )}
                        <div>
                            <span className="text-sm font-medium text-gray-600">Budget:</span>
                            <p className="text-base mt-1">₹{program.deliveryBudget?.toLocaleString()}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">Participants:</span>
                            <p className="text-base mt-1">{program.minPax} - {program.maxPax}</p>
                        </div>
                    </div>
                </div>

                {program.clientFeedback && (
                    <div className="mt-4 pt-4 border-t">
                        <span className="text-sm font-medium text-gray-600">Client Feedback:</span>
                        <p className="text-base mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                            {program.clientFeedback}
                        </p>
                    </div>
                )}
            </div>

            {/* Complete Program Timeline */}
            {program.transitions && program.transitions.length > 0 && (
                <div className="border p-6 rounded-md bg-white">
                    <h4 className="font-semibold text-lg mb-4 text-gray-800">Program Timeline</h4>

                    <div className="space-y-3">
                        {program.transitions.map((transition: any, index: number) => (
                            <div key={transition.id} className="flex items-start gap-4 pb-3 border-b last:border-b-0">
                                <div className="flex-shrink-0 w-24 text-sm text-gray-600">
                                    {format(new Date(transition.transitionedAt), "MMM d, yyyy")}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">
                                        Stage {transition.fromStage} → Stage {transition.toStage}
                                    </p>
                                    {transition.approvalNotes && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            {transition.approvalNotes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reopen Dialog */}
            <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reopen Program</DialogTitle>
                        <DialogDescription>
                            This will unlock the program and return it to Stage 4 for editing.
                            Please provide a justification for reopening this archived program.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="justification">Justification (Required)</Label>
                        <Textarea
                            id="justification"
                            placeholder="Explain why this program needs to be reopened..."
                            value={reopenJustification}
                            onChange={(e) => setReopenJustification(e.target.value)}
                            className="h-24"
                        />
                        <p className="text-xs text-gray-500">Minimum 10 characters required</p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsReopenDialogOpen(false)
                                setReopenJustification("")
                            }}
                            disabled={isReopening}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReopen}
                            disabled={isReopening || reopenJustification.length < 10}
                        >
                            {isReopening ? "Reopening..." : "Confirm Reopen"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
