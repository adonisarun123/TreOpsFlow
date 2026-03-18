"use client"

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    CartesianGrid,
    Area, AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, Clock, ArrowRight, Users, Truck, DollarSign, Activity, Layers, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const STAGE_NAMES: Record<number, string> = {
    1: "Tentative Handover",
    2: "Accepted Handover",
    3: "Feasibility",
    4: "Delivery",
    5: "Post Trip Closure",
    6: "Done",
}

const STAGE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#f97316", "#64748b"]
const TYPE_COLORS = ["#4F46E5", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#ec4899"]

interface ReportsChartsProps {
    stats: {
        totalPrograms: number
        activePrograms: number
        completedPrograms: number
        pendingPrograms: number
        pipelineRevenue: number
        completedRevenue: number
        stageCounts: { stage: number; count: number }[]
        thisMonthRevenue: number
        lastMonthRevenue: number
        growthPct: number
        weeklyNew: number
    }
    revenueByType: { type: string; revenue: number; count: number }[]
    facilitators: { name: string; active: number; completed: number; total: number; revenue: number }[]
    monthlyRevenue: { month: string; revenue: number; count: number }[]
    recentActivity: {
        id: string; programName: string; programId: string
        fromStage: number; toStage: number
        userName: string; userRole: string; budget: number | null
        transitionedAt: string
    }[]
    transportData: {
        id: string; programId: string; programName: string; currentStage: number
        teamTransportDetails: string | null; clientTransportDetails: string | null
        location: string | null; programDates: string | null
    }[]
}

function formatCurrency(n: number) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n.toLocaleString()}`
}

function timeAgo(isoDate: string) {
    const diff = Date.now() - new Date(isoDate).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export function ReportsCharts({ stats, revenueByType, facilitators, monthlyRevenue, recentActivity, transportData }: ReportsChartsProps) {
    const stageData = stats.stageCounts.map(s => ({
        name: STAGE_NAMES[s.stage] || `Stage ${s.stage}`,
        count: s.count,
    }))

    const growthIcon = stats.growthPct > 0
        ? <TrendingUp className="h-4 w-4 text-emerald-500" />
        : stats.growthPct < 0
            ? <TrendingDown className="h-4 w-4 text-red-500" />
            : <Minus className="h-4 w-4 text-muted-foreground" />
    const growthColor = stats.growthPct > 0 ? "text-emerald-600" : stats.growthPct < 0 ? "text-red-600" : "text-muted-foreground"

    return (
        <div className="space-y-6">
            {/* ── KPI Cards ── */}
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6 md:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pipeline Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.pipelineRevenue)}</div>
                        <div className={`flex items-center gap-1 text-xs mt-1 ${growthColor}`}>
                            {growthIcon}
                            <span>{stats.growthPct > 0 ? "+" : ""}{stats.growthPct}% vs last month</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed Revenue</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.completedRevenue)}</div>
                        <p className="text-xs text-muted-foreground">{stats.completedPrograms} programs closed</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Programs</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activePrograms}</div>
                        <p className="text-xs text-muted-foreground">+{stats.weeklyNew} this week</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Programs</CardTitle>
                        <Layers className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPrograms}</div>
                        <p className="text-xs text-muted-foreground">{stats.pendingPrograms} pending handover</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Charts Row 1: Revenue Trend + Stage Distribution ── */}
            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Revenue Trend (6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyRevenue}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                                    <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
                                    <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fill="url(#revenueGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-base">Stage Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stageData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                                        {stageData.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Charts Row 2: Revenue by Type + Facilitator Workload ── */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Revenue by Program Type</CardTitle>
                        <CardDescription>Budget breakdown across program types</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            {revenueByType.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueByType} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                                        <YAxis dataKey="type" type="category" width={120} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                                        <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
                                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                            {revenueByType.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No program type data yet</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Facilitator Workload</CardTitle>
                        <CardDescription>Active programs per Ops SPOC</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {facilitators.length > 0 ? (
                            <div className="space-y-3">
                                {facilitators.map(f => (
                                    <div key={f.name} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                                            {f.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{f.name}</p>
                                            <div className="flex gap-3 text-xs text-muted-foreground">
                                                <span className="text-blue-600">{f.active} active</span>
                                                <span className="text-emerald-600">{f.completed} done</span>
                                                <span>{formatCurrency(f.revenue)}</span>
                                            </div>
                                        </div>
                                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((f.active / Math.max(...facilitators.map(x => x.active), 1)) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No facilitator data yet</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Row 3: Recent Activity + Transport Tracking ── */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Activity</CardTitle>
                        <CardDescription>Latest stage transitions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {recentActivity.map(a => (
                                    <div key={a.id} className="flex items-start gap-3 text-sm border-b border-border/50 pb-2.5 last:border-0">
                                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: STAGE_COLORS[a.toStage - 1] || '#94a3b8' }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{a.programName}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                {STAGE_NAMES[a.fromStage]} <ArrowRight className="h-3 w-3" /> {STAGE_NAMES[a.toStage]}
                                                <span className="ml-auto">{a.userName}</span>
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{timeAgo(a.transitionedAt)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                                <Activity className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-sm">No activity yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> Transport Tracking</CardTitle>
                        <CardDescription>Programs with active transport blocking</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transportData.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {transportData.map(t => (
                                    <div key={t.id} className="border border-border/50 rounded-md p-2.5 text-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm truncate">{t.programName}</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t.programId}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                            {t.location && <p>📍 {t.location}</p>}
                                            {t.teamTransportDetails && <p>🚌 Team: {t.teamTransportDetails.slice(0, 80)}{t.teamTransportDetails.length > 80 ? '…' : ''}</p>}
                                            {t.clientTransportDetails && <p>🚗 Client: {t.clientTransportDetails.slice(0, 80)}{t.clientTransportDetails.length > 80 ? '…' : ''}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                                <Truck className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-sm">No active transports</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
