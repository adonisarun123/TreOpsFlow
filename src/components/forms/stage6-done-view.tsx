"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RotateCcw, Archive, CheckCircle, Calendar, MapPin, Users, DollarSign } from "lucide-react"
import { showToast } from "@/components/ui/toaster"
import { format } from "date-fns"

interface Stage6DoneViewProps {
    program: any
    currentUser: any
}

export function Stage6DoneView({ program, currentUser }: Stage6DoneViewProps) {
    const [isReopening, setIsReopening] = useState(false)
    const router = useRouter()

    const isAdmin = currentUser?.role === 'Admin'

    async function onReopen() {
        setIsReopening(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/reopen`, { method: 'POST' })
            const result = await res.json()
            if (result.error) {
                showToast(result.error, "error")
            } else {
                showToast("Program reopened and returned to Post Trip Closure", "success")
                router.refresh()
            }
        } catch (error) {
            showToast("Failed to reopen program", "error")
        } finally {
            setIsReopening(false)
        }
    }

    let closedDate = "N/A"
    if (program.closedAt) {
        try {
            closedDate = format(new Date(program.closedAt), "dd MMM yyyy, hh:mm a")
        } catch { closedDate = String(program.closedAt) }
    }

    return (
        <div className="border p-6 rounded-md bg-green-50 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Program Complete — Done
                </h3>
                <Badge variant="outline" className="text-green-700 border-green-500">Archived</Badge>
            </div>

            <p className="text-gray-600">
                This program has been completed and archived. All data is preserved for collection and reporting purposes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-md border">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Archive className="h-3 w-3" /> Closed On
                    </div>
                    <p className="font-medium text-sm">{closedDate}</p>
                </div>
                <div className="bg-white p-4 rounded-md border">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <MapPin className="h-3 w-3" /> Location
                    </div>
                    <p className="font-medium text-sm">{program.location || "N/A"}</p>
                </div>
                <div className="bg-white p-4 rounded-md border">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Users className="h-3 w-3" /> Participants
                    </div>
                    <p className="font-medium text-sm">{program.participantCount || program.actualParticipantCount || "N/A"}</p>
                </div>
                <div className="bg-white p-4 rounded-md border">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <DollarSign className="h-3 w-3" /> ZFD Rating
                    </div>
                    <p className="font-medium text-sm">
                        {program.zfdRating ? `${program.zfdRating} / 5` : "N/A"}
                    </p>
                </div>
            </div>

            {program.zfdComments && (
                <div className="bg-white p-4 rounded-md border">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">ZFD Comments</h4>
                    <p className="text-sm">{program.zfdComments}</p>
                </div>
            )}

            {program.finalNotes && (
                <div className="bg-white p-4 rounded-md border">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Final Notes</h4>
                    <p className="text-sm">{program.finalNotes}</p>
                </div>
            )}

            {isAdmin && (
                <div className="border-t pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onReopen}
                        disabled={isReopening}
                        className="text-orange-600 border-orange-400 hover:bg-orange-50"
                    >
                        {isReopening ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                        Reopen Program (Admin)
                    </Button>
                </div>
            )}
        </div>
    )
}
