/**
 * Tests for settings server actions.
 * Verifies AppSetting CRUD operations and auth guards.
 */

// Mock Prisma
const mockFindMany = jest.fn()
const mockFindUnique = jest.fn()
const mockUpsert = jest.fn()

jest.mock('@/lib/prisma', () => ({
    prisma: {
        appSetting: {
            findMany: (...args: unknown[]) => mockFindMany(...args),
            findUnique: (...args: unknown[]) => mockFindUnique(...args),
            upsert: (...args: unknown[]) => mockUpsert(...args),
        },
    },
}))

// Mock auth
const mockAuth = jest.fn()
jest.mock('@/auth', () => ({
    auth: () => mockAuth(),
}))

// Mock revalidatePath
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

import { getAppSettings, getAppSetting, updateAppSetting } from '@/app/actions/settings'

describe('getAppSettings', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns empty array when not authenticated', async () => {
        mockAuth.mockResolvedValue(null)
        const result = await getAppSettings()
        expect(result).toEqual([])
        expect(mockFindMany).not.toHaveBeenCalled()
    })

    it('returns all settings when authenticated', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
        const mockSettings = [
            { key: 'opsDataEntrySheetUrl', value: 'https://sheets.google.com/1', label: null },
            { key: 'tripExpenseSheetUrl', value: 'https://sheets.google.com/2', label: null },
        ]
        mockFindMany.mockResolvedValue(mockSettings)

        const result = await getAppSettings()
        expect(result).toEqual(mockSettings)
        expect(mockFindMany).toHaveBeenCalled()
    })
})

describe('getAppSetting', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns null when not authenticated', async () => {
        mockAuth.mockResolvedValue(null)
        const result = await getAppSetting('someKey')
        expect(result).toBeNull()
    })

    it('returns a single setting by key', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Ops' } })
        const mockSetting = { key: 'opsDataEntrySheetUrl', value: 'https://sheets.google.com/1' }
        mockFindUnique.mockResolvedValue(mockSetting)

        const result = await getAppSetting('opsDataEntrySheetUrl')
        expect(result).toEqual(mockSetting)
        expect(mockFindUnique).toHaveBeenCalledWith({ where: { key: 'opsDataEntrySheetUrl' } })
    })
})

describe('updateAppSetting', () => {
    beforeEach(() => jest.clearAllMocks())

    it('rejects non-Admin users', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Sales' } })
        const result = await updateAppSetting('key', 'value')
        expect(result).toEqual({ error: expect.stringContaining('Unauthorized') })
        expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('rejects Finance role', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Finance' } })
        const result = await updateAppSetting('key', 'value')
        expect(result).toEqual({ error: expect.stringContaining('Unauthorized') })
    })

    it('rejects Ops role', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Ops' } })
        const result = await updateAppSetting('key', 'value')
        expect(result).toEqual({ error: expect.stringContaining('Unauthorized') })
    })

    it('rejects empty value', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
        const result = await updateAppSetting('key', '   ')
        expect(result).toEqual({ error: 'Key and value are required' })
    })

    it('rejects empty key', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
        const result = await updateAppSetting('', 'value')
        expect(result).toEqual({ error: 'Key and value are required' })
    })

    it('upserts setting successfully for Admin', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
        mockUpsert.mockResolvedValue({ key: 'opsDataEntrySheetUrl', value: 'https://new-url.com' })

        const result = await updateAppSetting('opsDataEntrySheetUrl', '  https://new-url.com  ')
        expect(result).toEqual({ success: true })
        expect(mockUpsert).toHaveBeenCalledWith({
            where: { key: 'opsDataEntrySheetUrl' },
            update: { value: 'https://new-url.com' },
            create: { key: 'opsDataEntrySheetUrl', value: 'https://new-url.com', label: 'opsDataEntrySheetUrl' },
        })
    })

    it('returns error on database failure', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
        mockUpsert.mockRejectedValue(new Error('DB error'))

        const result = await updateAppSetting('key', 'value')
        expect(result).toEqual({ error: 'Failed to update setting' })
    })
})
