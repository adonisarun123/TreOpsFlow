import { auth } from "@/auth"
import { getPendingApprovals } from "@/app/actions/rejection"
import { redirect } from "next/navigation"

export const revalidate = 15
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight, Building2, MapPin, IndianRupee, User, Inbox } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default async function PendingApprovalsPage() {
    const session = await auth()
    const userRole = (session?.user as any)?.role

    if (!session) {
        redirect("/login")
    }

    if (userRole !== 'Finance' && userRole !== 'Ops' && userRole !== 'Admin') {
        redirect("/dashboard")
    }

    const result = await getPendingApprovals(userRole)
    const programs = result.programs || []
    const count = result.count || 0

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
                    {count > 0 && (
                        <span className="bg-orange-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                            {count}
                        </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {userRole === 'Finance' && "Programs awaiting budget approval"}
                    {userRole === 'Ops' && "Programs awaiting handover acceptance"}
                    {userRole === 'Admin' && "Programs awaiting approval (Finance & Ops)"}
                </p>
            </div>

            {count === 0 ? (
                <div className="bg-card rounded-xl border border-border shadow-sm text-center py-16 px-6">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
                        <Inbox className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">All caught up!</h3>
                    <p className="text-sm text-muted-foreground">No programs currently awaiting your approval.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {programs.map((program: any) => {
                        const createdAgo = program.createdAt
                            ? formatDistanceToNow(new Date(program.createdAt), { addSuffix: true })
                            : null
                        
                        // Urgency color based on age
                        let urgencyColor = "bg-emerald-500" // < 3 days
                        if (program.createdAt) {
                            const daysSince = (Date.now() - new Date(program.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                            if (daysSince > 7) urgencyColor = "bg-red-500"
                            else if (daysSince > 3) urgencyColor = "bg-amber-500"
                        }

                        return (
                            <div key={program.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                                <div className="flex items-stretch">
                                    {/* Urgency bar */}
                                    <div className={`w-1 ${urgencyColor} shrink-0`} />

                                    <div className="flex-1 p-4 sm:p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="font-semibold text-foreground text-base truncate">
                                                        {program.programName}
                                                    </h3>
                                                    <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                                        {program.programId}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                    {program.companyName && (
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="h-3 w-3" />
                                                            {program.companyName}
                                                        </span>
                                                    )}
                                                    {program.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {program.location}
                                                        </span>
                                                    )}
                                                    {program.deliveryBudget && (
                                                        <span className="flex items-center gap-1">
                                                            <IndianRupee className="h-3 w-3" />
                                                            {program.deliveryBudget.toLocaleString()}
                                                        </span>
                                                    )}
                                                    {program.salesOwner && (
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {program.salesOwner.name}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                                    {/* Stage badge */}
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground`}>
                                                        Stage {program.currentStage}
                                                    </span>
                                                    {!program.financeApprovalReceived && (
                                                        <span className="stage-badge-1 px-2 py-0.5 rounded text-[11px] font-medium">
                                                            Awaiting Finance
                                                        </span>
                                                    )}
                                                    {!program.handoverAcceptedByOps && program.currentStage <= 2 && (
                                                        <span className="stage-badge-5 px-2 py-0.5 rounded text-[11px] font-medium">
                                                            Awaiting Ops
                                                        </span>
                                                    )}
                                                    {createdAgo && (
                                                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            Created {createdAgo}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="shrink-0">
                                                <Link href={`/dashboard/programs/${program.id}`}>
                                                    <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm">
                                                        Review
                                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
