import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getPendingApprovals } from "@/app/actions/rejection"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect('/login')
    }

    const user = session.user as { role?: string; name?: string }
    const userRole = user?.role || 'Sales'
    const userName = user?.name || 'User'
    const pendingApprovals = await getPendingApprovals(userRole)
    const pendingCount = pendingApprovals.success ? pendingApprovals.programs?.length || 0 : 0

    return (
        <DashboardShell
            userRole={userRole}
            userName={userName}
            pendingCount={pendingCount}
        >
            {children}
        </DashboardShell>
    )
}
