import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getPrograms } from "@/app/actions/program"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
    const session = await auth()
    const user = session?.user as any
    const programs = await getPrograms()

    const isSales = user?.role === 'Sales' || user?.role === 'Admin'

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                {isSales && (
                    <Link href="/dashboard/programs/new">
                        <Button>+ New Program</Button>
                    </Link>
                )}
            </div>

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
                                try {
                                    const dates = JSON.parse(program.programDates || "[]")
                                    if (dates.length > 0) date = new Date(dates[0]).toLocaleDateString()
                                } catch (e) { }

                                return (
                                    <TableRow key={program.id}>
                                        <TableCell className="font-medium">{program.programId}</TableCell>
                                        <TableCell>{program.programName}</TableCell>
                                        <TableCell>{date}</TableCell>
                                        <TableCell>
                                            <Badge variant={program.currentStage === 5 ? "secondary" : "default"}>
                                                Stage {program.currentStage}
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
        </div>
    )
}
