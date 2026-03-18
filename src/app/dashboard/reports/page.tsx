import { auth } from "@/auth"
import { getDashboardStats, getRevenueByType, getFacilitatorWorkload, getMonthlyRevenue, getRecentActivity, getTransportReport } from "@/app/actions/admin"
import { ReportsCharts } from "@/components/dashboard/reports-charts"

export const revalidate = 60

export default async function ReportsPage() {
    const session = await auth()
    if (!session) return null

    const [stats, revenueByType, facilitators, monthlyRevenue, recentActivity, transportData] = await Promise.all([
        getDashboardStats(),
        getRevenueByType(),
        getFacilitatorWorkload(),
        getMonthlyRevenue(),
        getRecentActivity(),
        getTransportReport(),
    ])

    if (!stats) return null

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
                    <p className="text-sm text-muted-foreground">Real-time insights across your program pipeline</p>
                </div>
            </div>

            <ReportsCharts
                stats={stats}
                revenueByType={revenueByType}
                facilitators={facilitators}
                monthlyRevenue={monthlyRevenue}
                recentActivity={recentActivity}
                transportData={transportData}
            />
        </div>
    )
}
