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
import { Badge } from "@/components/ui/badge"
import { KanbanBoard } from "./kanban-board"
import { LayoutGrid, List } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

interface DashboardViewProps {
    programs: any[]
    userRole: string
}

export function DashboardView({ programs, userRole }: DashboardViewProps) {
    const [viewMode, setViewMode] = useState<"list" | "board">("list")
    const isSales = userRole === 'Sales' || userRole === 'Admin'

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

                <div className="flex items-center gap-4">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "board")}>
                        <TabsList>
                            <TabsTrigger value="list" className="flex items-center gap-2">
                                <List className="h-4 w-4" /> List
                            </TabsTrigger>
                            <TabsTrigger value="board" className="flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4" /> Board
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {isSales && (
                        <Link href="/dashboard/programs/new">
                            <Button>+ New Program</Button>
                        </Link>
                    )}
                </div>
            </div>

            {viewMode === "list" ? (
                <div className="bg-white rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Program ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Sales Owner</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {programs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No programs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                programs.map((program) => {
                                    let date = "N/A"
                                    if (program.programDates) {
                                        try {
                                            const parsed = JSON.parse(program.programDates)
                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                date = format(new Date(parsed[0]), "dd/MM/yyyy")
                                            }
                                        } catch {
                                            // programDates is a plain string, not JSON
                                            try {
                                                date = format(new Date(program.programDates), "dd/MM/yyyy")
                                            } catch {
                                                date = program.programDates
                                            }
                                        }
                                    }

                                    return (
                                        <TableRow key={program.id}>
                                            <TableCell className="font-medium">{program.programId}</TableCell>
                                            <TableCell>{program.programName}</TableCell>
                                            <TableCell>{date}</TableCell>
                                            <TableCell>
                                                <Badge variant={program.currentStage === 6 ? "secondary" : "default"}>
                                                    {["", "Tentative", "Accepted", "Feasibility", "Delivery", "Post Trip", "Done"][program.currentStage] || `Stage ${program.currentStage}`}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{program.salesOwner?.name}</TableCell>
                                            <TableCell>
                                                <Link href={`/dashboard/programs/${program.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <KanbanBoard initialPrograms={programs} />
            )}
        </div>
    )
}
