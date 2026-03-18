"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    FolderOpen,
    Bell,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
} from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

interface SidebarProps {
    userRole: string
    userName: string
    pendingCount: number
    onSignOut: () => void
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/programs", label: "All Programs", icon: FolderOpen },
    { href: "/dashboard/pending-approvals", label: "Pending Approvals", icon: Bell, roles: ["Finance", "Ops", "Admin"] },
    { href: "/dashboard/team", label: "Team", icon: Users, roles: ["Admin"] },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ userRole, userName, pendingCount, onSignOut }: SidebarProps) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard"
        return pathname.startsWith(href)
    }

    const filteredItems = navItems.filter(item => {
        if (!item.roles) return true
        return item.roles.includes(userRole)
    })

    const initials = userName
        ? userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : userRole[0]?.toUpperCase() || "U"

    const roleColor = {
        Admin: "bg-indigo-500",
        Ops: "bg-emerald-500",
        Finance: "bg-amber-500",
        Sales: "bg-blue-500",
    }[userRole] || "bg-slate-500"

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="px-4 py-4 border-b border-sidebar-border flex flex-col items-center gap-2">
                <Image src="/logo.png?v=2" alt="Knot by Trebound" width={200} height={200} className="rounded-2xl w-[140px] md:w-[180px]" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {filteredItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                                ${active
                                    ? "bg-sidebar-accent text-white shadow-sm"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                                }
                            `}
                        >
                            <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-indigo-400" : ""}`} />
                            <span className="flex-1">{item.label}</span>
                            {item.href === "/dashboard/pending-approvals" && pendingCount > 0 && (
                                <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center">
                                    {pendingCount}
                                </Badge>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom section */}
            <div className="px-3 pb-4 space-y-2 border-t border-sidebar-border pt-3">
                <ThemeToggle />

                {/* User info */}
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className={`h-8 w-8 rounded-full ${roleColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-sidebar-foreground truncate">{userName || "User"}</p>
                        <p className="text-[11px] text-sidebar-foreground/50">{userRole}</p>
                    </div>
                </div>

                {/* Sign out */}
                <button
                    onClick={onSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-sidebar-foreground/50 hover:text-red-400 hover:bg-sidebar-accent transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-card border shadow-md text-foreground"
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 left-0 h-screen w-[72vw] max-w-64 md:w-64 bg-sidebar z-40
                transition-transform duration-200 ease-in-out
                ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}>
                {sidebarContent}
            </aside>
        </>
    )
}
