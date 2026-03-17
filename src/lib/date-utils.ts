import { format } from "date-fns"

/**
 * Shared date utilities for TreOpsFlow.
 * Consolidates date parsing, formatting, and urgency badge logic
 * that was previously duplicated across kanban-card, programs-table, and dashboard-view.
 */

/**
 * Parse a programDates string (JSON array or plain string) into a Date.
 * Returns null if parsing fails.
 */
export function parseProgramDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null
    try {
        try {
            const parsed = JSON.parse(dateStr)
            if (Array.isArray(parsed) && parsed.length > 0) {
                const d = new Date(parsed[0])
                return isNaN(d.getTime()) ? null : d
            }
        } catch {
            // Not JSON, try direct parse
        }
        const d = new Date(dateStr)
        return isNaN(d.getTime()) ? null : d
    } catch {
        return null
    }
}

/**
 * Format a programDates string for display.
 * @param dateStr - Raw programDates value from database
 * @param formatStr - date-fns format string (default: "dd MMM yyyy")
 * @returns Formatted date string or "N/A"
 */
export function formatProgramDate(
    dateStr: string | null | undefined,
    formatStr: string = "dd MMM yyyy"
): string {
    const d = parseProgramDate(dateStr)
    if (!d) return "N/A"
    try {
        return format(d, formatStr)
    } catch {
        return dateStr || "N/A"
    }
}

/**
 * Calculate days until a program date from today.
 * @returns Number of days (negative = past), or null if date is invalid.
 */
export function getDaysUntil(dateStr: string | null | undefined): number | null {
    const d = parseProgramDate(dateStr)
    if (!d) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Timeline urgency badge — returns label and CSS class based on days until program date.
 * Used in kanban cards and program tables.
 */
export interface TimelineBadge {
    label: string
    cls: string
}

export function getTimelineBadge(
    dateStr: string | null | undefined,
    currentStage: number
): TimelineBadge | null {
    if (currentStage >= 6) return null
    const days = getDaysUntil(dateStr)
    if (days === null) return null

    if (days < 0) {
        return {
            label: `${Math.abs(days)}d ago`,
            cls: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
        }
    }
    if (days === 0) {
        return {
            label: "Today",
            cls: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 animate-pulse",
        }
    }
    if (days <= 3) {
        return {
            label: `${days}d`,
            cls: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
        }
    }
    if (days <= 7) {
        return {
            label: `${days}d`,
            cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
        }
    }
    return {
        label: `${days}d`,
        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    }
}
