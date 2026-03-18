"use client"

import { useState } from "react"
import { CheckCircle2, Circle, MapPin, Clock, Users, Phone, ChevronDown, ChevronUp, Truck, Package, FileText, AlertTriangle } from "lucide-react"

interface MobileChecklistProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    program: Record<string, any>
}

function CheckItem({ label, checked, highlight }: { label: string; checked: boolean; highlight?: boolean }) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
            checked
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                : highlight
                    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                    : "bg-card border-border"
        }`}>
            {checked
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
            }
            <span className={`text-sm ${checked ? "line-through text-muted-foreground" : "font-medium"}`}>{label}</span>
        </div>
    )
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: {
    title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="border rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{title}</span>
                </div>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {open && <div className="p-3 space-y-2">{children}</div>}
        </div>
    )
}

export function MobileChecklist({ program }: MobileChecklistProps) {
    let dateDisplay = "N/A"
    try {
        const parsed = JSON.parse(program.programDates || "")
        dateDisplay = Array.isArray(parsed) ? parsed.join(", ") : program.programDates
    } catch {
        dateDisplay = program.programDates || "N/A"
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            {/* Header */}
            <div className="bg-primary text-primary-foreground rounded-xl p-4">
                <p className="text-xs font-mono opacity-70">{program.programId}</p>
                <h1 className="text-lg font-bold mt-0.5">{program.programName}</h1>
                <p className="text-sm opacity-80 mt-1">{program.companyName}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {program.location || "N/A"}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {dateDisplay}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {program.minPax}-{program.maxPax} pax</span>
                </div>
            </div>

            {/* Special Instructions */}
            {program.specialInstructions && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold text-sm text-amber-800 dark:text-amber-200">Special Instructions</span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">{program.specialInstructions}</p>
                </div>
            )}

            {/* Pre-Delivery Checklist */}
            <CollapsibleSection title="Pre-Delivery Checklist" icon={Package} defaultOpen>
                <CheckItem label="Confirm Activity Availability" checked={program.confirmActivityAvailability} highlight />
                <CheckItem label="Discuss Agenda" checked={program.agendaWalkthroughDone} />
                <CheckItem label="Facilitators Availability & Blocking" checked={program.confirmFacilitatorsAvailability} highlight />
                <CheckItem label="Plan Deliverables & Value Adds" checked={program.planDeliverablesValueAdds} />
                <CheckItem label="Transportation Blocking" checked={program.transportationBlocking} highlight />
                <CheckItem label="Helper Blocking" checked={program.helperBlocking} />
                <CheckItem label="Welcome Email to Client" checked={program.welcomeEmailChecklist} />
                <CheckItem label="Ops Cash Request" checked={program.opsCashRequest} />
                <CheckItem label="Activity Area / Conference Hall" checked={program.activityAreaConferenceHall} />
                <CheckItem label="Logistics List" checked={program.logisticsChecklist} highlight />
                <CheckItem label="Procurement" checked={program.procurementChecklist} />
                <CheckItem label="Final Packing" checked={program.finalPacking} highlight />
            </CollapsibleSection>

            {/* Prints */}
            <CollapsibleSection title="Print Documents" icon={FileText}>
                <CheckItem label="Handover Sheet" checked={program.printHandoverSheet} />
                <CheckItem label="Score Sheet" checked={program.printScoreSheet} />
                <CheckItem label="Logistics Sheet" checked={program.printLogisticsSheet} />
                <CheckItem label="Blueprints" checked={program.printBlueprints} />
            </CollapsibleSection>

            {/* Transport & Helpers */}
            <CollapsibleSection title="Transport & Helpers" icon={Truck}>
                {program.teamTransportDetails && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground font-medium mb-1">🚌 Team Transport</p>
                        <p className="text-sm">{program.teamTransportDetails}</p>
                    </div>
                )}
                {program.clientTransportDetails && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground font-medium mb-1">🚗 Client Transport</p>
                        <p className="text-sm">{program.clientTransportDetails}</p>
                    </div>
                )}
                {program.helperDetails && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground font-medium mb-1">👷 Helpers</p>
                        <p className="text-sm">{program.helperDetails}</p>
                    </div>
                )}
            </CollapsibleSection>

            {/* Safety */}
            {program.nearestHospitalDetails && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-red-600" />
                        <span className="font-semibold text-sm text-red-800 dark:text-red-200">Nearest Hospital</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">{program.nearestHospitalDetails}</p>
                </div>
            )}

            {/* Delivery Status */}
            <div className="text-center py-4 text-xs text-muted-foreground">
                <p>Packing by: {program.packingFinalCheckBy || "Not assigned"}</p>
                {program.photosVideosDriveLink && (
                    <a href={program.photosVideosDriveLink} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        📸 Photos/Videos Drive Link
                    </a>
                )}
            </div>
        </div>
    )
}
