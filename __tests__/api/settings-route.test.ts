/**
 * Tests for the /api/settings GET endpoint.
 * Verifies authentication and settings retrieval.
 */

const mockFindMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
    prisma: {
        appSetting: {
            findMany: (...args: unknown[]) => mockFindMany(...args),
        },
    },
}))

const mockAuth = jest.fn()
jest.mock('@/auth', () => ({
    auth: () => mockAuth(),
}))

// We need to test the route handler directly
import { GET } from '@/app/api/settings/route'

describe('GET /api/settings', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns 401 when not authenticated', async () => {
        mockAuth.mockResolvedValue(null)

        const response = await GET()

        expect(response.status).toBe(401)
    })

    it('returns settings as JSON map when authenticated', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Ops' } })
        mockFindMany.mockResolvedValue([
            { key: 'opsDataEntrySheetUrl', value: 'https://sheets.google.com/ops' },
            { key: 'tripExpenseSheetUrl', value: 'https://sheets.google.com/expense' },
        ])

        const response = await GET()
        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toEqual({
            opsDataEntrySheetUrl: 'https://sheets.google.com/ops',
            tripExpenseSheetUrl: 'https://sheets.google.com/expense',
        })
    })

    it('returns empty object when no settings exist', async () => {
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
        mockFindMany.mockResolvedValue([])

        const response = await GET()
        const data = await response.json()
        expect(data).toEqual({})
    })

    it('allows any authenticated role to read settings', async () => {
        const roles = ['Sales', 'Ops', 'Finance', 'Admin']
        for (const role of roles) {
            mockAuth.mockResolvedValue({ user: { role } })
            mockFindMany.mockResolvedValue([])

            const response = await GET()
            expect(response.status).toBe(200)
        }
    })
})
