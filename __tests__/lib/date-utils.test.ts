import {
    parseProgramDate,
    parseProgramEndDate,
    formatProgramDate,
    getDaysUntil,
    getTimelineBadge,
} from '@/lib/date-utils'

// ─── parseProgramDate ───

describe('parseProgramDate', () => {
    it('returns null for null/undefined/empty', () => {
        expect(parseProgramDate(null)).toBeNull()
        expect(parseProgramDate(undefined)).toBeNull()
        expect(parseProgramDate('')).toBeNull()
    })

    it('parses ISO date string (yyyy-MM-dd)', () => {
        const result = parseProgramDate('2026-03-18')
        expect(result).toBeInstanceOf(Date)
        expect(result!.getFullYear()).toBe(2026)
        expect(result!.getMonth()).toBe(2) // March = 2
        expect(result!.getDate()).toBe(18)
    })

    it('parses locale "PP" format (Mar 18, 2026)', () => {
        const result = parseProgramDate('Mar 18, 2026')
        expect(result).toBeInstanceOf(Date)
        expect(result!.getFullYear()).toBe(2026)
        expect(result!.getMonth()).toBe(2)
        expect(result!.getDate()).toBe(18)
    })

    it('parses JSON array with single date', () => {
        const result = parseProgramDate('["2026-04-10"]')
        expect(result).toBeInstanceOf(Date)
        expect(result!.getFullYear()).toBe(2026)
        expect(result!.getMonth()).toBe(3) // April
        expect(result!.getDate()).toBe(10)
    })

    it('parses JSON array with multiple dates — returns first', () => {
        const result = parseProgramDate('["2026-03-18", "2026-03-20"]')
        expect(result).toBeInstanceOf(Date)
        expect(result!.getDate()).toBe(18)
    })

    it('parses ISO range format — returns start date', () => {
        const result = parseProgramDate('2026-03-18 - 2026-03-22')
        expect(result).toBeInstanceOf(Date)
        expect(result!.getDate()).toBe(18)
    })

    it('parses locale PP range format — returns start date', () => {
        const result = parseProgramDate('Mar 18, 2026 - Mar 22, 2026')
        expect(result).toBeInstanceOf(Date)
        expect(result!.getDate()).toBe(18)
    })

    it('returns null for completely invalid string', () => {
        expect(parseProgramDate('not-a-date')).toBeNull()
    })

    it('returns null for invalid JSON array content', () => {
        expect(parseProgramDate('["invalid-date"]')).toBeNull()
    })

    it('returns null for empty JSON array', () => {
        expect(parseProgramDate('[]')).toBeNull()
    })
})

// ─── parseProgramEndDate ───

describe('parseProgramEndDate', () => {
    it('returns null for null/undefined/empty', () => {
        expect(parseProgramEndDate(null)).toBeNull()
        expect(parseProgramEndDate(undefined)).toBeNull()
        expect(parseProgramEndDate('')).toBeNull()
    })

    it('returns null for single date (no range)', () => {
        expect(parseProgramEndDate('2026-03-18')).toBeNull()
    })

    it('returns null for JSON array with single date', () => {
        expect(parseProgramEndDate('["2026-03-18"]')).toBeNull()
    })

    it('returns end date from JSON array with multiple dates', () => {
        const result = parseProgramEndDate('["2026-03-18", "2026-03-19", "2026-03-20"]')
        expect(result).toBeInstanceOf(Date)
        expect(result!.getDate()).toBe(20)
    })

    it('returns end date from ISO range format', () => {
        const result = parseProgramEndDate('2026-03-18 - 2026-03-22')
        expect(result).toBeInstanceOf(Date)
        expect(result!.getDate()).toBe(22)
    })

    it('returns end date from locale PP range format', () => {
        const result = parseProgramEndDate('Mar 18, 2026 - Mar 22, 2026')
        expect(result).toBeInstanceOf(Date)
        expect(result!.getDate()).toBe(22)
    })

    it('returns null for invalid range end date', () => {
        expect(parseProgramEndDate('2026-03-18 - invalid')).toBeNull()
    })
})

// ─── formatProgramDate ───

describe('formatProgramDate', () => {
    it('returns "N/A" for null/undefined/empty', () => {
        expect(formatProgramDate(null)).toBe('N/A')
        expect(formatProgramDate(undefined)).toBe('N/A')
        expect(formatProgramDate('')).toBe('N/A')
    })

    it('formats ISO date with default format', () => {
        const result = formatProgramDate('2026-03-18')
        expect(result).toBe('18 Mar 2026')
    })

    it('formats locale PP date correctly', () => {
        const result = formatProgramDate('Mar 18, 2026', 'dd MMM')
        expect(result).toBe('18 Mar')
    })

    it('formats ISO date range for Kanban cards', () => {
        const result = formatProgramDate('2026-03-18 - 2026-03-22', 'dd MMM')
        expect(result).toBe('18 Mar - 22 Mar')
    })

    it('formats locale PP date range for Kanban cards', () => {
        const result = formatProgramDate('Mar 18, 2026 - Mar 22, 2026', 'dd MMM')
        expect(result).toBe('18 Mar - 22 Mar')
    })

    it('formats JSON array date range for Kanban cards', () => {
        const result = formatProgramDate('["2026-03-18", "2026-03-22"]', 'dd MMM')
        expect(result).toBe('18 Mar - 22 Mar')
    })

    it('shows single date if range start equals end', () => {
        const result = formatProgramDate('2026-03-18 - 2026-03-18', 'dd MMM')
        expect(result).toBe('18 Mar')
    })

    it('returns "N/A" for invalid date string', () => {
        expect(formatProgramDate('not-a-date')).toBe('N/A')
    })

    it('formats full date range with year', () => {
        const result = formatProgramDate('2026-03-18 - 2026-04-02', 'dd MMM yyyy')
        expect(result).toBe('18 Mar 2026 - 02 Apr 2026')
    })

    it('handles JSON array with single entry', () => {
        const result = formatProgramDate('["2026-06-15"]', 'dd MMM')
        expect(result).toBe('15 Jun')
    })

    it('formats single date with custom format', () => {
        const result = formatProgramDate('2026-03-18', 'dd MMM')
        expect(result).toBe('18 Mar')
    })
})

// ─── getDaysUntil ───

describe('getDaysUntil', () => {
    it('returns null for null/undefined/empty', () => {
        expect(getDaysUntil(null)).toBeNull()
        expect(getDaysUntil(undefined)).toBeNull()
        expect(getDaysUntil('')).toBeNull()
    })

    it('returns 0 for today', () => {
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        expect(getDaysUntil(todayStr)).toBe(0)
    })

    it('returns positive for future dates', () => {
        const future = new Date()
        future.setDate(future.getDate() + 5)
        const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`
        expect(getDaysUntil(futureStr)).toBe(5)
    })

    it('returns negative for past dates', () => {
        const past = new Date()
        past.setDate(past.getDate() - 3)
        const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`
        expect(getDaysUntil(pastStr)).toBe(-3)
    })

    it('handles range format — uses start date', () => {
        const today = new Date()
        today.setDate(today.getDate() + 10)
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} - 2026-12-31`
        expect(getDaysUntil(dateStr)).toBe(10)
    })
})

// ─── getTimelineBadge ───

describe('getTimelineBadge', () => {
    it('returns null for Stage 6 (Done)', () => {
        const future = new Date()
        future.setDate(future.getDate() + 5)
        const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`
        expect(getTimelineBadge(futureStr, 6)).toBeNull()
    })

    it('returns null for invalid date', () => {
        expect(getTimelineBadge(null, 3)).toBeNull()
        expect(getTimelineBadge('invalid', 3)).toBeNull()
    })

    it('returns "Today" badge for today', () => {
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        const badge = getTimelineBadge(todayStr, 3)
        expect(badge).not.toBeNull()
        expect(badge!.label).toBe('Today')
        expect(badge!.cls).toContain('red')
        expect(badge!.cls).toContain('animate-pulse')
    })

    it('returns red badge for 1-3 days away', () => {
        const soon = new Date()
        soon.setDate(soon.getDate() + 2)
        const soonStr = `${soon.getFullYear()}-${String(soon.getMonth() + 1).padStart(2, '0')}-${String(soon.getDate()).padStart(2, '0')}`
        const badge = getTimelineBadge(soonStr, 3)
        expect(badge!.label).toBe('2d')
        expect(badge!.cls).toContain('red')
    })

    it('returns amber badge for 4-7 days away', () => {
        const week = new Date()
        week.setDate(week.getDate() + 5)
        const weekStr = `${week.getFullYear()}-${String(week.getMonth() + 1).padStart(2, '0')}-${String(week.getDate()).padStart(2, '0')}`
        const badge = getTimelineBadge(weekStr, 3)
        expect(badge!.label).toBe('5d')
        expect(badge!.cls).toContain('amber')
    })

    it('returns emerald badge for 8+ days away', () => {
        const far = new Date()
        far.setDate(far.getDate() + 15)
        const farStr = `${far.getFullYear()}-${String(far.getMonth() + 1).padStart(2, '0')}-${String(far.getDate()).padStart(2, '0')}`
        const badge = getTimelineBadge(farStr, 3)
        expect(badge!.label).toBe('15d')
        expect(badge!.cls).toContain('emerald')
    })

    it('returns slate badge for past dates', () => {
        const past = new Date()
        past.setDate(past.getDate() - 5)
        const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`
        const badge = getTimelineBadge(pastStr, 4)
        expect(badge!.label).toBe('5d ago')
        expect(badge!.cls).toContain('slate')
    })
})
