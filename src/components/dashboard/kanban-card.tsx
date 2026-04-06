"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CalendarIcon, Building2, Eye, GripVertical, MapPin, Users, Trash2 } from "lucide-react"
import { formatProgramDate, getTimelineBadge } from "@/lib/date-utils"
import type { ProgramWithSalesOwner } from "@/types"

interface KanbanCardProps {
    program: ProgramWithSalesOwner
    onCardClick?: (program: ProgramWithSalesOwner) => void
    userRole?: string
    onDelete?: (program: ProgramWithSalesOwner) => void
}

const STAGE_ACCENT_COLORS: Record<number, string> = {
    1: "border-l-amber-400",
    2: "border-l-blue-400",
    3: "border-l-violet-400",
    4: "border-l-emerald-400",
    5: "border-l-orange-400",
    6: "border-l-slate-400",
}

export function KanbanCard({ program, onCardClick, userRole, onDelete }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: program.id, data: { program } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        scale: isDragging ? "1.02" : "1",
    }

    const date = formatProgramDate(program.programDates, "dd MMM")
    const badge = getTimelineBadge(program.programDates, program.currentStage)
    const timelineBadge = badge?.label || ""
    const timelineColor = badge?.cls || ""

    const getInitials = (name?: string | null) => {
        if (!name) return "?"
        const parts = name.trim().split(/\s+/)
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase()
        }
        return (parts[0][0] + parts[1][0]).toUpperCase()
    }

    const salesInitials = getInitials(program.salesOwner?.name)
    const opsInitials = getInitials(program.opsSPOCAssignedName)

    function handleClick(e: React.MouseEvent) {
        if (onCardClick && !isDragging) {
            e.stopPropagation()
            onCardClick(program)
        }
    }

    const accentClass = STAGE_ACCENT_COLORS[program.currentStage] || "border-l-slate-400"

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2">
            <div
                className={`
                    bg-card rounded-lg border border-border shadow-sm
                    border-l-[3px] ${accentClass}
                    hover:shadow-md hover:-translate-y-0.5
                    transition-all duration-150 group
                    cursor-grab active:cursor-grabbing
                    ${isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}
                `}
                onClick={handleClick}
            >
                {/* Top row: drag handle + title + actions */}
                <div className="flex items-start gap-1.5 px-3 pt-2.5 pb-1">
                    <div className="mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity shrink-0">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
                            {program.programName}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {onCardClick && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onCardClick(program)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                                title="View details"
                            >
                                <Eye className="h-3.5 w-3.5 text-primary" />
                            </button>
                        )}
                        {userRole === 'Admin' && onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(program)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950"
                                title="Delete program"
                            >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Info rows */}
                <div className="px-3 pb-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{program.companyName || "No Client"}</span>
                    </div>

                    {/* Program Type badge */}
                    {program.programType && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium truncate">
                                {program.programType}
                            </span>
                        </div>
                    )}

                    {/* Location */}
                    {program.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{program.location}</span>
                        </div>
                    )}

                    {/* Pax range */}
                    {(program.minPax || program.maxPax) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Users className="h-3 w-3 shrink-0" />
                            <span>{program.minPax || '?'}-{program.maxPax || '?'} pax</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <CalendarIcon className="h-3 w-3 shrink-0" />
                            <span>{date}</span>
                            {timelineBadge && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${timelineColor}`}>
                                    {timelineBadge}
                                </span>
                            )}
                        </div>

                        {/* POC Avatars */}
                        <div className="flex items-center -space-x-1 hover:space-x-1 transition-all duration-200 cursor-default">
                            <div 
                                className="h-5 w-5 rounded-full bg-primary/10 border border-background text-primary flex items-center justify-center text-[9px] font-bold z-10"
                                title={`Sales POC: ${program.salesOwner?.name || "Unassigned"}`}
                            >
                                {salesInitials}
                            </div>
                            <div 
                                className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-background text-blue-700 dark:text-blue-400 flex items-center justify-center text-[9px] font-bold z-0"
                                title={`Ops POC: ${program.opsSPOCAssignedName || "Unassigned"}`}
                            >
                                {opsInitials}
                            </div>
                        </div>
                    </div>

                    {/* Program ID pill */}
                    <div className="pt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                            {program.programId}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
