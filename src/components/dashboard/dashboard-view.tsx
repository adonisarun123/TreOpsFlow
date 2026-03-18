"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import dynamic from "next/dynamic"

const KanbanBoard = dynamic(
    () => import("./kanban-board").then((mod) => mod.KanbanBoard),
    { ssr: false, loading: () => <div className="h-96 flex items-center justify-center text-muted-foreground w-full border border-dashed rounded-xl">Loading board...</div> }
)
import {
    Plus,
    FolderOpen,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
} from "lucide-react"
import { format } from "date-fns"

interface DashboardViewProps {
    programs: any[]
    userRole: string
}

const STAGE_NAMES = ["", "Tentative", "Accepted", "Feasibility", "Delivery", "Post Trip", "Done"]

function getStageClass(stage: number) {
    return `stage-badge-${stage}`
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return "N/A"
    try {
        const parsed = JSON.parse(dateStr)
        if (Array.isArray(parsed) && parsed.length > 0) {
            return format(new Date(parsed[0]), "dd MMM yyyy")
        }
    } catch {
        try {
            return format(new Date(dateStr), "dd MMM yyyy")
        } catch {
            return dateStr
        }
    }
    return "N/A"
}

function getTimelineBadge(dateStr: string | null, currentStage: number) {
    if (!dateStr || currentStage >= 6) return null
    try {
        let parsedDate: Date | null = null
        try {
            const parsed = JSON.parse(dateStr)
            if (Array.isArray(parsed) && parsed.length > 0) parsedDate = new Date(parsed[0])
        } catch {
            parsedDate = new Date(dateStr)
        }
        if (!parsedDate || isNaN(parsedDate.getTime())) return null
        const today = new Date(); today.setHours(0,0,0,0); parsedDate.setHours(0,0,0,0)
        const days = Math.ceil((parsedDate.getTime() - today.getTime()) / 86400000)
        if (days < 0) return { label: `${Math.abs(days)}d ago`, cls: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" }
        if (days === 0) return { label: "Today", cls: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 animate-pulse" }
        if (days <= 3) return { label: `${days}d`, cls: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" }
        if (days <= 7) return { label: `${days}d`, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" }
        return { label: `${days}d`, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" }
    } catch { return null }
}

export function DashboardView({ programs, userRole }: DashboardViewProps) {
    const isSales = userRole === 'Sales' || userRole === 'Admin'

    const totalPrograms = programs.length
    const activePrograms = programs.filter(p => p.currentStage >= 1 && p.currentStage <= 5).length
    const pendingPrograms = programs.filter(p => p.currentStage === 1).length
    const completedPrograms = programs.filter(p => p.currentStage === 6).length

    const stats = [
        { label: "Total Programs", value: totalPrograms, icon: FolderOpen, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/50" },
        { label: "Active", value: activePrograms, icon: Clock, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/50" },
        { label: "Pending Review", value: pendingPrograms, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/50" },
        { label: "Completed", value: completedPrograms, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
    ]

    // Stage distribution
    const stageDistribution = [1, 2, 3, 4, 5, 6].map(stage => ({
        stage,
        count: programs.filter(p => p.currentStage === stage).length,
        name: STAGE_NAMES[stage],
    }))

    return (
        <div className="space-y-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Program lifecycle overview</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <a href="/api/programs/export" download className="hidden sm:inline-flex">
                        <Button size="sm" variant="outline" className="shadow-sm">
                            <Download className="h-4 w-4 mr-1" /> Export
                        </Button>
                    </a>

                    {isSales && (
                        <Link href="/dashboard/programs/new" className="w-full sm:w-auto">
                            <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-1" /> New Program
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm">
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stage distribution bar */}
            {totalPrograms > 0 && (
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider">Pipeline Distribution</p>
                    <div className="flex rounded-full overflow-hidden h-2.5 bg-muted">
                        {stageDistribution.map(({ stage, count }) => {
                            const pct = (count / totalPrograms) * 100
                            if (pct === 0) return null
                            const colors = ["", "bg-amber-400", "bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-orange-400", "bg-slate-400"]
                            return (
                                <div
                                    key={stage}
                                    className={`${colors[stage]} transition-all duration-500`}
                                    style={{ width: `${pct}%` }}
                                    title={`${STAGE_NAMES[stage]}: ${count} (${Math.round(pct)}%)`}
                                />
                            )
                        })}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        {stageDistribution.filter(s => s.count > 0).map(({ stage, count, name }) => {
                            const dots = ["", "bg-amber-400", "bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-orange-400", "bg-slate-400"]
                            return (
                                <div key={stage} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <div className={`h-2 w-2 rounded-full ${dots[stage]}`} />
                                    {name} ({count})
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Content */}
            <KanbanBoard initialPrograms={programs} />
        </div>
    )
}
