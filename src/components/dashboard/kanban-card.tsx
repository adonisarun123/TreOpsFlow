"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, User, Building2, Eye } from "lucide-react"
import { format } from "date-fns"

interface KanbanCardProps {
    program: any
    onCardClick?: (program: any) => void
}

export function KanbanCard({ program, onCardClick }: KanbanCardProps) {
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
        opacity: isDragging ? 0.5 : 1,
    }

    let date = "N/A"
    if (program.programDates) {
        try {
            const parsed = JSON.parse(program.programDates)
            if (Array.isArray(parsed) && parsed.length > 0) {
                date = format(new Date(parsed[0]), "dd/MM/yyyy")
            }
        } catch {
            try {
                date = format(new Date(program.programDates), "dd/MM/yyyy")
            } catch {
                date = program.programDates
            }
        }
    }

    function handleClick(e: React.MouseEvent) {
        // Only trigger view if it wasn't a drag
        if (onCardClick && !isDragging) {
            e.stopPropagation()
            onCardClick(program)
        }
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
            <Card
                className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                onClick={handleClick}
            >
                <CardHeader className="p-3 pb-0">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-sm font-medium leading-tight">
                            {program.programName}
                        </CardTitle>
                        <div className="flex items-center gap-1 shrink-0">
                            {onCardClick && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onCardClick(program)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100"
                                    title="View details"
                                >
                                    <Eye className="h-3.5 w-3.5 text-blue-500" />
                                </button>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1 h-5">
                                {program.programId}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 text-xs text-muted-foreground space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{program.companyName || "No Client"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3 shrink-0" />
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 shrink-0" />
                        <span>{program.salesOwner?.name || "Unassigned"}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
