"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ProgramDetailsView({ program }: { program: any }) {
    let date = "N/A"
    try {
        const dates = JSON.parse(program.programDates || "[]")
        if (dates.length > 0) date = new Date(dates[0]).toLocaleDateString()
    } catch (e) { }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Core Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Program ID:</span>
                        <span className="font-medium">{program.programId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span>{program.programType}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span>{date}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span>{program.location}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Pax:</span>
                        <span>{program.minPax} - {program.maxPax}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Client Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Company:</span>
                        <span className="font-medium">{program.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">POC Name:</span>
                        <span>{program.clientPOCName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span>{program.clientPOCPhone}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span>{program.clientPOCEmail}</span>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Commercials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Budget:</span>
                        <span className="font-medium">₹{program.deliveryBudget}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Finance Approval:</span>
                        <Badge variant={program.financeApprovalReceived ? "success" : "destructive"}>
                            {program.financeApprovalReceived ? "Approved" : "Pending"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Sales Owner:</span>
                        <span>{program.salesOwner?.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Ops Owner:</span>
                        <span>{program.opsOwner?.name || "Unassigned"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Handover Status:</span>
                        <Badge variant={program.handoverAcceptedByOps ? "success" : "secondary"}>
                            {program.handoverAcceptedByOps ? "Accepted" : "Pending"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
