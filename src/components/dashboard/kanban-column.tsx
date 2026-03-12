"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"

interface KanbanColumnProps {
    id: string
    title: string
    programs: any[]
    onCardClick?: (program: any) => void
}

export function KanbanColumn({ id, title, programs, onCardClick }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id })

    return (
        <div className="flex flex-col h-full bg-slate-50/50 rounded-lg border border-slate-200 min-w-[280px] w-[280px]">
            {/* Header */}
            <div className="p-3 border-b border-slate-200 bg-white rounded-t-lg sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
                    <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        {programs.length}
                    </span>
                </div>
            </div>

            {/* Droppable Area */}
            <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto min-h-[150px]">
                <SortableContext
                    items={programs.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {programs.map((program) => (
                        <KanbanCard key={program.id} program={program} onCardClick={onCardClick} />
                    ))}
                </SortableContext>

                {programs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic min-h-[100px]">
                        Drop items here
                    </div>
                )}
            </div>
        </div>
    )
}
