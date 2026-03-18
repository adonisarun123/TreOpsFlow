import { format, parse, isValid } from "date-fns"

/**
 * Shared date utilities for TreOpsFlow.
 * Consolidates date parsing, formatting, and urgency badge logic
 * that was previously duplicated across kanban-card, programs-table, and dashboard-view.
 */

/**
 * Safely parse a date string that could be in ISO (yyyy-MM-dd), locale "PP" (Mar 18, 2026), or full ISO format.
 * Falls back gracefully across formats.
 */
function safeParseSingle(str: string): Date | null {
    if (!str) return null
    const trimmed = str.trim()
    // Try native Date constructor first (handles ISO and many formats)
    const d = new Date(trimmed)
    if (isValid(d) && !isNaN(d.getTime())) return d
    // Try date-fns parse with common formats
    const formats = ["MMM d, yyyy", "MMM dd, yyyy", "yyyy-MM-dd", "dd MMM yyyy"]
    for (const fmt of formats) {
        try {
            const parsed = parse(trimmed, fmt, new Date())
            if (isValid(parsed)) return parsed
        } catch {
            // continue to next format
        }
    }
    return null
}

/**
 * Parse a programDates string (JSON array, " - " range, or plain string) into a Date.
 * Returns the first/start date. Returns null if parsing fails.
 */
export function parseProgramDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null
    try {
        // Try JSON array format: ["2026-03-18", "2026-03-20"]
        try {
            const parsed = JSON.parse(dateStr)
            if (Array.isArray(parsed) && parsed.length > 0) {
                return safeParseSingle(parsed[0])
            }
        } catch {
            // Not JSON, continue
        }
        // Try range format: "2026-03-18 - 2026-03-20" or "Mar 18, 2026 - Mar 22, 2026"
        if (dateStr.includes(' - ')) {
            return safeParseSingle(dateStr.split(' - ')[0])
        }
        // Plain date string
        return safeParseSingle(dateStr)
    } catch {
        return null
    }
}

/**
 * Parse the end date from a programDates range string.
 * Returns null if not a range or parsing fails.
 */
export function parseProgramEndDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null
    try {
        // JSON array format
        try {
            const parsed = JSON.parse(dateStr)
            if (Array.isArray(parsed) && parsed.length > 1) {
                return safeParseSingle(parsed[parsed.length - 1])
            }
        } catch {
            // Not JSON
        }
        // Range format: "2026-03-18 - 2026-03-20" or "Mar 18, 2026 - Mar 22, 2026"
        if (dateStr.includes(' - ')) {
            const parts = dateStr.split(' - ')
            if (parts.length >= 2) {
                return safeParseSingle(parts[parts.length - 1])
            }
        }
        return null
    } catch {
        return null
    }
}

/**
 * Format a programDates string for display.
 * Handles single dates and date ranges (both JSON array and " - " formats).
 * @param dateStr - Raw programDates value from database
 * @param formatStr - date-fns format string (default: "dd MMM yyyy")
 * @returns Formatted date string or "N/A"
 */
export function formatProgramDate(
    dateStr: string | null | undefined,
    formatStr: string = "dd MMM yyyy"
): string {
    const startDate = parseProgramDate(dateStr)
    if (!startDate) return "N/A"
    try {
        const endDate = parseProgramEndDate(dateStr)
        const startFormatted = format(startDate, formatStr)
        if (endDate && endDate.getTime() !== startDate.getTime()) {
            const endFormatted = format(endDate, formatStr)
            return `${startFormatted} - ${endFormatted}`
        }
        return startFormatted
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
