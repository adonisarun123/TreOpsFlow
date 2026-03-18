import { auth } from "@/auth"
import { getPendingApprovals } from "@/app/actions/rejection"
import { redirect } from "next/navigation"

export const revalidate = 15
import { Inbox } from "lucide-react"
import { PendingApprovalCard } from "@/components/dashboard/pending-approval-card"

export default async function PendingApprovalsPage() {
    const session = await auth()
    const userRole = (session?.user as { role?: string })?.role

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
                    {programs.map((program) => (
                        <PendingApprovalCard
                            key={program.id}
                            program={program}
                            userRole={userRole}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
