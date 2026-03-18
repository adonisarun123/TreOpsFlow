import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, MapPin, Users, Building2, Phone, Mail, Clock, DollarSign, FileText, Activity, ExternalLink, CircleCheck } from "lucide-react"
import { formatProgramDate } from "@/lib/date-utils"

function DetailRow({ label, value, icon }: { label: string, value: any, icon?: React.ReactNode }) {
    if (!value && value !== 0) return null
    return (
        <div className="flex items-start gap-2 text-sm py-1.5 group">
            {icon && <span className="text-muted-foreground/70 mt-0.5 flex-shrink-0 group-hover:text-foreground transition-colors">{icon}</span>}
            <div className="min-w-0 flex-1">
                <span className="text-muted-foreground text-[11px] uppercase tracking-wider block mb-0.5">{label}</span>
                <span className="text-foreground break-words font-medium">{value}</span>
            </div>
        </div>
    )
}

export function Stage1Summary({ program }: { program: any }) {
    if (!program) return <div>No program data available</div>

    return (
        <div className="space-y-6 pb-4">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-foreground mb-2">{program.programName}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5">{program.programType}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{program.programId}</span>
                </div>
            </div>

            {/* Logistics */}
            <div className="space-y-1">
                <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <MapPin className="h-3 w-3" /> Logistics
                </h4>
                <div className="pl-4 border-l-2 border-muted">
                    <DetailRow label="Location" value={program.location} />
                    <DetailRow label="Dates" value={formatProgramDate(program.programDates)} icon={<CalendarIcon className="h-3.5 w-3.5" />} />
                    <DetailRow label="Timings" value={program.programTimings} icon={<Clock className="h-3.5 w-3.5" />} />
                    <DetailRow label="Pax Range" value={`${program.minPax || 'N/A'} – ${program.maxPax || 'N/A'}`} icon={<Users className="h-3.5 w-3.5" />} />
                    <DetailRow label="Training Days" value={program.trainingDays || 'Not set'} />
                </div>
            </div>

            {/* Client Details */}
            <div className="space-y-1">
                <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Building2 className="h-3 w-3" /> Client Details
                </h4>
                <div className="pl-4 border-l-2 border-muted">
                    <DetailRow label="Company" value={program.companyName} />
                    <DetailRow label="Address" value={program.companyAddress} />
                    <div className="mt-2 text-sm">
                        <span className="text-muted-foreground text-[11px] uppercase tracking-wider block mb-0.5">Primary Contact</span>
                        <div className="font-medium text-foreground">{program.clientPOCName}</div>
                        {program.clientPOCPhone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" /> {program.clientPOCPhone}
                            </div>
                        )}
                        {program.clientPOCEmail && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <Mail className="h-3 w-3" /> {program.clientPOCEmail}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Program Details */}
            <div className="space-y-1">
                <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Activity className="h-3 w-3" /> Program Details
                </h4>
                <div className="pl-4 border-l-2 border-muted">
                    <DetailRow label="Activity Type" value={program.activityType} />
                    <DetailRow label="Objectives" value={program.objectives} />
                    <DetailRow label="Activities Committed" value={program.activitiesCommitted} />
                    {program.previousEngagement && (
                        <div className="mt-2 pt-2 border-t border-dashed border-border/50">
                            <span className="text-muted-foreground text-[11px] uppercase tracking-wider block mb-0.5">Previous Engagement</span>
                            <p className="text-sm text-foreground">{program.previousEngagementNotes || "Yes"}</p>
                        </div>
                    )}
                    <DetailRow label="Photo/Video Commitment" value={program.photoVideoCommitment ? "Yes" : "No"} />
                </div>
            </div>

            {/* Budget & Billing */}
            <div className="space-y-1">
                <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <DollarSign className="h-3 w-3" /> Budget & Billing
                </h4>
                <div className="pl-4 border-l-2 border-muted">
                    <DetailRow label="Delivery Budget" value={program.deliveryBudget ? `₹${Number(program.deliveryBudget).toLocaleString()}` : null} />
                    <DetailRow label="Billing Details" value={program.billingDetails} />

                    {(program.budgetVenue || program.budgetTransport || program.budgetActivities || program.budgetFood || program.budgetMiscellaneous) && (
                        <div className="mt-2 pt-2 border-t border-dashed border-border/50 text-sm">
                            <span className="text-muted-foreground text-[11px] uppercase tracking-wider block mb-1">Budget Breakdown</span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                                {program.budgetVenue > 0 && <div>Venue: <span className="text-foreground">₹{Number(program.budgetVenue).toLocaleString()}</span></div>}
                                {program.budgetTransport > 0 && <div>Transport: <span className="text-foreground">₹{Number(program.budgetTransport).toLocaleString()}</span></div>}
                                {program.budgetActivities > 0 && <div>Activities: <span className="text-foreground">₹{Number(program.budgetActivities).toLocaleString()}</span></div>}
                                {program.budgetFood > 0 && <div>Food: <span className="text-foreground">₹{Number(program.budgetFood).toLocaleString()}</span></div>}
                                {program.budgetMiscellaneous > 0 && <div>Misc: <span className="text-foreground">₹{Number(program.budgetMiscellaneous).toLocaleString()}</span></div>}
                            </div>
                        </div>
                    )}
                    {program.budgetNotes && <DetailRow label="Budget Notes" value={program.budgetNotes} />}
                </div>
            </div>

            {/* Venue & Vendor */}
            <div className="space-y-1">
                <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest mb-2">Venue & Vendor</h4>
                <div className="pl-4 border-l-2 border-muted">
                    <DetailRow label="Venue POC" value={program.venuePOC} />
                    <DetailRow label="Special Venue Requirements" value={program.specialVenueReq} />
                    <DetailRow label="Event Vendor Details" value={program.eventVendorDetails} />
                </div>
            </div>

            {/* Documents */}
            {(program.agendaDocument || program.objectiveDocuments) && (
                <div className="space-y-1 mt-4">
                    <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <FileText className="h-3 w-3" /> Documents
                    </h4>
                    <div className="pl-4 border-l-2 border-muted space-y-2">
                        {program.agendaDocument && (
                            <a href={program.agendaDocument} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline group">
                                <ExternalLink className="h-3.5 w-3.5" /> Agenda Document
                            </a>
                        )}
                        {program.objectiveDocuments && (
                            <a href={program.objectiveDocuments} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline group">
                                <ExternalLink className="h-3.5 w-3.5" /> Objective Documents
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Approval Status */}
            <div className="space-y-1 mt-4">
                <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest mb-2">Approval Status</h4>
                <div className="pl-4 border-l-2 border-muted">
                    <div className="flex flex-wrap gap-2 mt-1 mb-3">
                        <Badge variant={program.financeApprovalReceived ? "default" : "outline"} className="text-xs font-normal px-2 flex items-center gap-1">
                            {program.financeApprovalReceived
                                ? <><CircleCheck className="h-3 w-3 text-emerald-500" /> Finance: Approved</>
                                : <><Clock className="h-3 w-3 text-amber-500" /> Finance: Pending</>
                            }
                        </Badge>
                        <Badge variant={program.handoverAcceptedByOps ? "default" : "outline"} className="text-xs font-normal px-2 flex items-center gap-1">
                            {program.handoverAcceptedByOps
                                ? <><CircleCheck className="h-3 w-3 text-emerald-500" /> Ops: Accepted</>
                                : <><Clock className="h-3 w-3 text-amber-500" /> Ops: Pending</>
                            }
                        </Badge>
                    </div>
                    {program.salesOwner && (
                        <DetailRow label="Sales Owner" value={program.salesOwner.name} />
                    )}
                </div>
            </div>
        </div>
    )
}
