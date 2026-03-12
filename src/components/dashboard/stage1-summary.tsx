import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, MapPin, Users, Building2, Phone, Mail, Clock, DollarSign, FileText, Activity, ExternalLink } from "lucide-react"

function parseProgramDates(rawDates: string | null | undefined): string {
    if (!rawDates) return 'N/A'
    try {
        const parsed = JSON.parse(rawDates)
        if (Array.isArray(parsed)) {
            return parsed.join(' - ')
        }
        return String(parsed)
    } catch {
        return rawDates
    }
}

function DetailRow({ label, value, icon }: { label: string, value: any, icon?: React.ReactNode }) {
    if (!value && value !== 0) return null
    return (
        <div className="flex items-start gap-2 text-sm py-1">
            {icon && <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>}
            <div className="min-w-0">
                <span className="text-gray-500 text-xs block">{label}</span>
                <span className="text-gray-800 break-words">{value}</span>
            </div>
        </div>
    )
}

export function Stage1Summary({ program }: { program: any }) {
    if (!program) return <div>No program data available</div>

    return (
        <div className="space-y-4 pb-4">
            {/* Header */}
            <div>
                <h3 className="text-base font-bold text-blue-900">{program.programName}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{program.programType}</Badge>
                    <span className="text-xs text-gray-500">{program.programId}</span>
                </div>
            </div>

            <Separator />

            {/* Logistics */}
            <div className="space-y-1">
                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Logistics
                </h4>
                <DetailRow label="Location" value={program.location} />
                <DetailRow label="Dates" value={parseProgramDates(program.programDates)} icon={<CalendarIcon className="h-3 w-3" />} />
                <DetailRow label="Timings" value={program.programTimings} icon={<Clock className="h-3 w-3" />} />
                <DetailRow label="Pax Range" value={`${program.minPax || 'N/A'} – ${program.maxPax || 'N/A'}`} icon={<Users className="h-3 w-3" />} />
                <DetailRow label="Training Days" value={program.trainingDays || 'Not set'} />
            </div>

            <Separator />

            {/* Client Details */}
            <div className="space-y-1">
                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Client Details
                </h4>
                <DetailRow label="Company" value={program.companyName} />
                <DetailRow label="Address" value={program.companyAddress} />
                <div className="bg-gray-50 p-2 rounded-md space-y-0.5 mt-1">
                    <div className="text-sm font-medium">{program.clientPOCName}</div>
                    {program.clientPOCPhone && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="h-3 w-3" /> {program.clientPOCPhone}
                        </div>
                    )}
                    {program.clientPOCEmail && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Mail className="h-3 w-3" /> {program.clientPOCEmail}
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            {/* Program Details */}
            <div className="space-y-1">
                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Program Details
                </h4>
                <DetailRow label="Activity Type" value={program.activityType} />
                <DetailRow label="Objectives" value={program.objectives} />
                <DetailRow label="Activities Committed" value={program.activitiesCommitted} />
                {program.previousEngagement && (
                    <div className="bg-blue-50 p-2 rounded text-xs">
                        <span className="font-medium text-blue-700">Previous Engagement: Yes</span>
                        {program.previousEngagementNotes && (
                            <p className="text-blue-600 mt-0.5">{program.previousEngagementNotes}</p>
                        )}
                    </div>
                )}
                <DetailRow label="Photo/Video Commitment" value={program.photoVideoCommitment ? "Yes" : "No"} />
            </div>

            <Separator />

            {/* Budget & Billing */}
            <div className="space-y-1">
                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Budget & Billing
                </h4>
                <DetailRow label="Delivery Budget" value={program.deliveryBudget ? `₹${Number(program.deliveryBudget).toLocaleString()}` : null} />
                <DetailRow label="Billing Details" value={program.billingDetails} />

                {(program.budgetVenue || program.budgetTransport || program.budgetActivities || program.budgetFood || program.budgetMiscellaneous) && (
                    <div className="bg-yellow-50 p-2 rounded text-xs space-y-0.5 mt-1">
                        <span className="font-medium text-yellow-800 text-xs">Budget Breakdown:</span>
                        {program.budgetVenue > 0 && <div className="text-yellow-700">Venue: ₹{Number(program.budgetVenue).toLocaleString()}</div>}
                        {program.budgetTransport > 0 && <div className="text-yellow-700">Transport: ₹{Number(program.budgetTransport).toLocaleString()}</div>}
                        {program.budgetActivities > 0 && <div className="text-yellow-700">Activities: ₹{Number(program.budgetActivities).toLocaleString()}</div>}
                        {program.budgetFood > 0 && <div className="text-yellow-700">Food: ₹{Number(program.budgetFood).toLocaleString()}</div>}
                        {program.budgetMiscellaneous > 0 && <div className="text-yellow-700">Misc: ₹{Number(program.budgetMiscellaneous).toLocaleString()}</div>}
                    </div>
                )}
                {program.budgetNotes && <DetailRow label="Budget Notes" value={program.budgetNotes} />}
            </div>

            <Separator />

            {/* Venue & Vendor */}
            <div className="space-y-1">
                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Venue & Vendor</h4>
                <DetailRow label="Venue POC" value={program.venuePOC} />
                <DetailRow label="Special Venue Requirements" value={program.specialVenueReq} />
                <DetailRow label="Event Vendor Details" value={program.eventVendorDetails} />
            </div>

            {/* Documents */}
            {(program.agendaDocument || program.objectiveDocuments) && (
                <>
                    <Separator />
                    <div className="space-y-1">
                        <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Documents
                        </h4>
                        {program.agendaDocument && (
                            <a href={program.agendaDocument} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-blue-600 hover:underline py-1">
                                <ExternalLink className="h-3 w-3" /> Agenda Document
                            </a>
                        )}
                        {program.objectiveDocuments && (
                            <a href={program.objectiveDocuments} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-blue-600 hover:underline py-1">
                                <ExternalLink className="h-3 w-3" /> Objective Documents
                            </a>
                        )}
                    </div>
                </>
            )}

            {/* Approval Status */}
            <Separator />
            <div className="space-y-1">
                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Approval Status</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant={program.financeApprovalReceived ? "default" : "outline"} className="text-xs">
                        Finance: {program.financeApprovalReceived ? "✅ Approved" : "⏳ Pending"}
                    </Badge>
                    <Badge variant={program.handoverAcceptedByOps ? "default" : "outline"} className="text-xs">
                        Ops: {program.handoverAcceptedByOps ? "✅ Accepted" : "⏳ Pending"}
                    </Badge>
                </div>
                {program.salesOwner && (
                    <DetailRow label="Sales Owner" value={program.salesOwner.name} />
                )}
            </div>
        </div>
    )
}
