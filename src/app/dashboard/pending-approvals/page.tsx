import { auth } from "@/auth"
import { getPendingApprovals } from "@/app/actions/rejection"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight } from "lucide-react"

export default async function PendingApprovalsPage() {
    const session = await auth()
    const userRole = (session?.user as any)?.role

    if (!session) {
        redirect("/login")
    }

    // Only Finance and Ops can see this page
    if (userRole !== 'Finance' && userRole !== 'Ops' && userRole !== 'Admin') {
        redirect("/dashboard")
    }

    const result = await getPendingApprovals(userRole)
    const programs = result.programs || []
    const count = result.count || 0

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    Pending Approvals
                    {count > 0 && (
                        <Badge variant="destructive" className="text-lg px-3 py-1">
                            {count}
                        </Badge>
                    )}
                </h1>
                <p className="text-gray-600 mt-2">
                    {userRole === 'Finance' && "Programs awaiting budget approval"}
                    {userRole === 'Ops' && "Programs awaiting handover acceptance"}
                    {userRole === 'Admin' && "Programs awaiting approval (Finance & Ops)"}
                </p>
            </div>

            {count === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center py-12">
                        <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            All caught up!
                        </h3>
                        <p className="text-gray-600">
                            No programs currently awaiting your approval.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {programs.map((program: any) => (
                        <Card key={program.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">
                                            {program.programName}
                                        </CardTitle>
                                        <CardDescription className="mt-2 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">ID:</span>
                                                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                    {program.programId}
                                                </code>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Client:</span>
                                                {program.companyName || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Location:</span>
                                                {program.location || 'N/A'}
                                            </div>
                                            {program.deliveryBudget && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">Budget:</span>
                                                    ₹{program.deliveryBudget.toLocaleString()}
                                                </div>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {!program.financeApprovalReceived && (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                                Awaiting Finance
                                            </Badge>
                                        )}
                                        {program.financeApprovalReceived && !program.handoverAcceptedByOps && (
                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                                Awaiting Ops Handover
                                            </Badge>
                                        )}
                                        {program.salesOwner && (
                                            <span className="text-sm text-gray-500">
                                                by {program.salesOwner.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end">
                                    <Link href={`/dashboard/programs/${program.id}`}>
                                        <Button>
                                            Review & {userRole === 'Finance' ? 'Approve/Reject' : 'Accept/Reject'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
