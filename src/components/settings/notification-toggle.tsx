"use client"

import { useState } from "react"
import { updateAppSetting } from "@/app/actions/settings"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { showToast } from "@/components/ui/toaster"

interface NotificationItem {
    key: string
    label: string
    description: string
}

const NOTIFICATIONS: NotificationItem[] = [
    {
        key: "notification_delivery_reminder",
        label: "Delivery Day Reminder",
        description: "1 day before program date",
    },
    {
        key: "notification_expense_overdue",
        label: "Expense Overdue Alert",
        description: "7 days after delivery, expense not submitted",
    },
    {
        key: "notification_timeline_approaching",
        label: "Timeline Approaching",
        description: "3 days before program date",
    },
    {
        key: "notification_low_zfd_alert",
        label: "Low ZFD Alert",
        description: "Alert when ZFD rating ≤ 3",
    },
]

interface NotificationTogglesProps {
    settings: Record<string, string>
    isAdmin: boolean
}

export function NotificationToggles({ settings, isAdmin }: NotificationTogglesProps) {
    const [localSettings, setLocalSettings] = useState<Record<string, string>>(settings)
    const [loadingKey, setLoadingKey] = useState<string | null>(null)

    async function handleToggle(key: string) {
        if (!isAdmin) return

        const currentValue = localSettings[key] !== "false" // default to true if not set
        const newValue = currentValue ? "false" : "true"

        setLoadingKey(key)
        setLocalSettings(prev => ({ ...prev, [key]: newValue }))

        const result = await updateAppSetting(key, newValue)

        if (result.error) {
            // Revert on error
            setLocalSettings(prev => ({ ...prev, [key]: currentValue ? "true" : "false" }))
            showToast(result.error, "error")
        } else {
            showToast(
                `${NOTIFICATIONS.find(n => n.key === key)?.label} ${newValue === "true" ? "enabled" : "disabled"}`,
                "success"
            )
        }

        setLoadingKey(null)
    }

    return (
        <div className="space-y-3">
            {NOTIFICATIONS.map((notification) => {
                const isEnabled = localSettings[notification.key] !== "false"
                const isLoading = loadingKey === notification.key

                return (
                    <div
                        key={notification.key}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                    >
                        <div>
                            <p className="text-sm font-medium">{notification.label}</p>
                            <p className="text-xs text-muted-foreground">{notification.description}</p>
                        </div>

                        {isAdmin ? (
                            <button
                                onClick={() => handleToggle(notification.key)}
                                disabled={isLoading}
                                className={`
                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                                    ${isEnabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}
                                    ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                                `}
                                aria-label={`Toggle ${notification.label}`}
                            >
                                <span
                                    className={`
                                        inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200
                                        ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                                    `}
                                />
                                {isLoading && (
                                    <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
                                )}
                            </button>
                        ) : (
                            <Badge className={
                                isEnabled
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                    : "bg-muted text-muted-foreground"
                            }>
                                {isEnabled ? "Active" : "Inactive"}
                            </Badge>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
