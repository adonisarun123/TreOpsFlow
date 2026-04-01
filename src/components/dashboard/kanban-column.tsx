"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"
import { FolderOpen } from "lucide-react"
import type { ProgramWithSalesOwner } from "@/types"

interface KanbanColumnProps {
    id: string
    title: string
    programs: ProgramWithSalesOwner[]
    onCardClick?: (program: ProgramWithSalesOwner) => void
    userRole?: string
    onDelete?: (program: ProgramWithSalesOwner) => void
}

const COLUMN_COLORS: Record<string, { border: string; header: string; dot: string }> = {
    "1": { border: "border-t-amber-400", header: "bg-amber-50 dark:bg-amber-950/30", dot: "bg-amber-400" },
    "2": { border: "border-t-blue-400", header: "bg-blue-50 dark:bg-blue-950/30", dot: "bg-blue-400" },
    "3": { border: "border-t-violet-400", header: "bg-violet-50 dark:bg-violet-950/30", dot: "bg-violet-400" },
    "4": { border: "border-t-emerald-400", header: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-400" },
    "5": { border: "border-t-orange-400", header: "bg-orange-50 dark:bg-orange-950/30", dot: "bg-orange-400" },
    "6": { border: "border-t-slate-400", header: "bg-slate-50 dark:bg-slate-800/30", dot: "bg-slate-400" },
}

export function KanbanColumn({ id, title, programs, onCardClick, userRole, onDelete }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id })
    const colors = COLUMN_COLORS[id] || COLUMN_COLORS["6"]

    return (
        <div className={`
            flex flex-col h-full bg-card rounded-xl border border-border min-w-[180px] md:min-w-[220px] flex-1
            border-t-[3px] ${colors.border} shadow-sm
            transition-shadow duration-200
            ${isOver ? "shadow-md ring-2 ring-primary/20" : ""}
        `}>
            {/* Header */}
            <div className={`p-3 border-b border-border ${colors.header} rounded-t-[9px] sticky top-0 z-10`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                        <h3 className="font-semibold text-xs text-foreground tracking-wide">{title}</h3>
                    </div>
                    <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums">
                        {programs.length}
                    </span>
                </div>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={`
                    flex-1 p-2 overflow-y-auto min-h-[120px]
                    ${isOver ? "bg-primary/5" : ""}
                    transition-colors duration-200
                `}
            >
                <SortableContext
                    items={programs.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {programs.map((program) => (
                        <KanbanCard key={program.id} program={program} onCardClick={onCardClick} userRole={userRole} onDelete={onDelete} />
                    ))}
                </SortableContext>

                {programs.length === 0 && (
                    <div className={`
                        h-full flex flex-col items-center justify-center min-h-[100px] 
                        rounded-lg border-2 border-dashed 
                        ${isOver ? "border-primary/40 bg-primary/5" : "border-border/50"}
                        transition-colors duration-200
                    `}>
                        <FolderOpen className="h-5 w-5 text-muted-foreground/30 mb-1" />
                        <span className="text-[11px] text-muted-foreground/40">Drop items here</span>
                    </div>
                )}
            </div>
        </div>
    )
}
