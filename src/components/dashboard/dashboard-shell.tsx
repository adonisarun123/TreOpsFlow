"use client"

import { signOut } from "next-auth/react"
import { Sidebar } from "@/components/dashboard/sidebar"

interface DashboardShellProps {
    children: React.ReactNode
    userRole: string
    userName: string
    pendingCount: number
}

export function DashboardShell({ children, userRole, userName, pendingCount }: DashboardShellProps) {
    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/login" })
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
                <div className="p-3 pt-14 md:pt-6 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
