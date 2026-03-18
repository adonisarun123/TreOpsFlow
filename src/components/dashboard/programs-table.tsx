"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Plus,
    FolderOpen,
    ArrowUpRight,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatProgramDate, getTimelineBadge as getTimelineBadgeUtil } from "@/lib/date-utils"

interface PaginationInfo {
    page: number
    pageSize: number
    total: number
    totalPages: number
}

interface ProgramsTableProps {
    programs: any[]
    userRole: string
    pagination?: PaginationInfo
}

const STAGE_NAMES = ["", "Tentative", "Accepted", "Feasibility", "Delivery", "Post Trip", "Done"]

function getStageClass(stage: number) {
    return `stage-badge-${stage}`
}

// Date formatting and timeline badge use shared utilities from @/lib/date-utils

export function ProgramsTable({ programs, userRole, pagination }: ProgramsTableProps) {
    const isSales = userRole === 'Sales' || userRole === 'Admin'
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()

    // Navigate with updated search params for server-side pagination
    function navigateWithParams(updates: Record<string, string | undefined>) {
        const params = new URLSearchParams(searchParams.toString())
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined && value !== '') {
                params.set(key, value)
            } else {
                params.delete(key)
            }
        }
        router.push(`/dashboard/programs?${params.toString()}`)
    }

    // Client-side filtering (fallback if no server pagination)
    const filteredPrograms = pagination ? programs : programs.filter(program => {
        const query = searchQuery.toLowerCase()
        return (
            (program.programName?.toLowerCase() || "").includes(query) ||
            (program.programId?.toLowerCase() || "").includes(query) ||
            (program.companyName?.toLowerCase() || "").includes(query)
        )
    })

    // Server-side search with debounce via URL params
    function handleSearch(value: string) {
        setSearchQuery(value)
        if (pagination) {
            // Debounce navigation for server search
            clearTimeout((window as any).__searchTimer)
            ;(window as any).__searchTimer = setTimeout(() => {
                navigateWithParams({ search: value || undefined, page: '1' })
            }, 400)
        }
    }

    return (
        <div className="space-y-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">All Programs</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Comprehensive list of all operations</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by ID, name, or company..."
                            className="pl-9 h-9 text-sm w-full"
                            value={searchQuery || searchParams.get('search') || ''}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    <a href="/api/programs/export" download className="hidden sm:inline-flex">
                        <Button size="sm" variant="outline" className="shadow-sm">
                            <Download className="h-4 w-4 mr-1" /> Export
                        </Button>
                    </a>

                    {isSales && (
                        <Link href="/dashboard/programs/new" className="shrink-0">
                            <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm">
                                <Plus className="h-4 w-4 mr-1" /> New
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Program ID</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stage</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Owner</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPrograms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-48 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <FolderOpen className="h-8 w-8 text-muted-foreground/30" />
                                        <p>No programs found matching "{searchQuery}"</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPrograms.map((program, i) => (
                                <TableRow key={program.id} className={`hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{program.programId}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-sm">{program.programName}</div>
                                        {program.companyName && <div className="text-xs text-muted-foreground">{program.companyName}</div>}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        <span>{formatProgramDate(program.programDates)}</span>
                                        {(() => {
                                            const badge = getTimelineBadgeUtil(program.programDates, program.currentStage)
                                            return badge ? <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span> : null
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${getStageClass(program.currentStage)}`}>
                                            {STAGE_NAMES[program.currentStage] || `Stage ${program.currentStage}`}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{program.salesOwner?.name}</TableCell>
                                    <TableCell>
                                        <Link href={`/dashboard/programs/${program.id}`}>
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:text-primary">
                                                View <ArrowUpRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/30 rounded-b-xl">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1}
                            onClick={() => navigateWithParams({ page: String(pagination.page - 1) })}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </Button>
                        <span className="text-xs sm:text-sm text-muted-foreground px-1 sm:px-2">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => navigateWithParams({ page: String(pagination.page + 1) })}
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
