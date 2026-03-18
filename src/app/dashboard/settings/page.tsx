import { auth } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings, User, Bell, Shield, Info, Database, ExternalLink, FileSpreadsheet } from "lucide-react"
import { getAppSettings } from "@/app/actions/settings"
import { SheetUrlForm } from "@/components/settings/sheet-url-form"
import { NotificationToggles } from "@/components/settings/notification-toggle"

export default async function SettingsPage() {
    const session = await auth()
    const user = session?.user as any
    const isAdmin = user?.role === 'Admin'

    const settings = await getAppSettings()
    const settingsMap = Object.fromEntries((settings as any[]).map((s: any) => [s.key, s.value]))

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Settings className="h-6 w-6" /> Settings
                </h2>
                <p className="text-sm text-muted-foreground">Manage your account and application preferences</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
                        <CardDescription>Your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Name</Label>
                            <Input disabled value={user?.name || ''} className="bg-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Email</Label>
                            <Input disabled value={user?.email || ''} className="bg-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Role</Label>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">{user?.role || 'Unknown'}</Badge>
                                <span className="text-xs text-muted-foreground">Contact admin to change</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
                        <CardDescription>
                            {isAdmin ? "Toggle automated notifications on or off" : "Automatic alert configuration"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NotificationToggles settings={settingsMap} isAdmin={isAdmin} />
                    </CardContent>
                </Card>

                {/* Stage Configuration */}
                {isAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Stage Pipeline</CardTitle>
                            <CardDescription>Workflow stages configuration (Admin only)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {[
                                    { stage: 1, name: "Tentative Handover", role: "Sales", color: "bg-amber-500" },
                                    { stage: 2, name: "Accepted Handover", role: "Ops", color: "bg-blue-500" },
                                    { stage: 3, name: "Feasibility & Preps", role: "Ops", color: "bg-violet-500" },
                                    { stage: 4, name: "Delivery", role: "Ops", color: "bg-emerald-500" },
                                    { stage: 5, name: "Post Trip Closure", role: "Ops", color: "bg-orange-500" },
                                    { stage: 6, name: "Done", role: "All", color: "bg-slate-500" },
                                ].map(s => (
                                    <div key={s.stage} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30">
                                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                                        <span className="text-sm font-medium flex-1">Stage {s.stage}: {s.name}</span>
                                        <Badge variant="outline" className="text-[10px]">{s.role}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Sheet URLs — Admin only */}
                {isAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> Sheet URLs</CardTitle>
                            <CardDescription>Configure Google Sheet links used in Stage 5 forms (Admin only)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SheetUrlForm
                                opsDataEntrySheetUrl={settingsMap['opsDataEntrySheetUrl'] || ''}
                                tripExpenseSheetUrl={settingsMap['tripExpenseSheetUrl'] || ''}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* API & Integrations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> API & Data</CardTitle>
                        <CardDescription>Export and integration endpoints</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-3 bg-muted/30 rounded-md">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium">CSV Export</p>
                                <a href="/api/programs/export" download className="text-xs text-primary hover:underline flex items-center gap-1">
                                    Download <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">/api/programs/export?stage=1-6</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-sm font-medium mb-1">Cron Endpoints</p>
                            <div className="space-y-1 text-xs font-mono text-muted-foreground">
                                <p>/api/cron/delivery-reminder</p>
                                <p>/api/cron/expense-overdue</p>
                                <p>/api/cron/timeline-reminder</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* App Info */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" /> Application Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs">App Name</p>
                                <p className="font-medium">Knot by Trebound</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Version</p>
                                <p className="font-medium">1.0.0</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Environment</p>
                                <Badge variant="outline" className="text-xs">{process.env.NODE_ENV}</Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Database</p>
                                <p className="font-medium">PostgreSQL (Prisma ORM)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
