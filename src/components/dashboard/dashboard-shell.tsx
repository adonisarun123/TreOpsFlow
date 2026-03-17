"use client"

import { Sidebar } from "@/components/dashboard/sidebar"

interface DashboardShellProps {
    children: React.ReactNode
    userRole: string
    userName: string
    pendingCount: number
}

export function DashboardShell({ children, userRole, userName, pendingCount }: DashboardShellProps) {
    const handleSignOut = async () => {
        // Call the server action via form submission
        const form = document.createElement("form")
        form.method = "POST"
        form.action = "/api/auth/signout"
        document.body.appendChild(form)
        form.submit()
    }

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar
                userRole={userRole}
                userName={userName}
                pendingCount={pendingCount}
                onSignOut={handleSignOut}
            />
            <main className="flex-1 min-w-0 overflow-hidden">
                <div className="p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
