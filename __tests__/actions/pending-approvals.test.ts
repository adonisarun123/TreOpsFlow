/**
 * Tests for pending approvals query logic.
 * Verifies that Finance approval is independent of Ops stage progression.
 */

const mockFindMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
    prisma: {
        programCard: {
            findMany: (...args: unknown[]) => mockFindMany(...args),
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        stageTransition: {
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}))

const mockAuth = jest.fn()
jest.mock('@/auth', () => ({
    auth: () => mockAuth(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

import { getPendingApprovals } from '@/app/actions/rejection'

describe('getPendingApprovals', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockFindMany.mockResolvedValue([])
    })

    // ─── Finance role queries ───

    describe('Finance role', () => {
        it('queries programs where financeApprovalReceived is false across ALL stages (< 6)', async () => {
            await getPendingApprovals('Finance')

            expect(mockFindMany).toHaveBeenCalledTimes(1)
            const query = mockFindMany.mock.calls[0][0]

            // Finance should NOT filter by currentStage === 1
            expect(query.where.financeApprovalReceived).toBe(false)
            expect(query.where.currentStage).toEqual({ lt: 6 })

            // Should NOT have currentStage === 1 as a constraint
            expect(query.where.currentStage).not.toBe(1)
        })

        it('excludes programs rejected by finance', async () => {
            await getPendingApprovals('Finance')
            const query = mockFindMany.mock.calls[0][0]

            expect(query.where.OR).toEqual(
                expect.arrayContaining([
                    { rejectionStatus: null },
                    { rejectionStatus: { not: 'rejected_finance' } },
                ])
            )
        })

        it('includes salesOwner relation', async () => {
            await getPendingApprovals('Finance')
            const query = mockFindMany.mock.calls[0][0]
            expect(query.include).toEqual({ salesOwner: { select: { name: true } } })
        })

        it('returns programs in Stage 3 with finance not approved', async () => {
            const stage3Program = {
                id: '1',
                programName: 'Test',
                currentStage: 3,
                financeApprovalReceived: false,
                rejectionStatus: null,
            }
            mockFindMany.mockResolvedValue([stage3Program])

            const result = await getPendingApprovals('Finance')
            expect(result.success).toBe(true)
            expect(result.count).toBe(1)
            expect(result.programs).toHaveLength(1)
        })
    })

    // ─── Ops role queries ───

    describe('Ops role', () => {
        it('queries programs in Stage 1-2 only', async () => {
            await getPendingApprovals('Ops')
            const query = mockFindMany.mock.calls[0][0]

            expect(query.where.currentStage).toEqual({ in: [1, 2] })
        })

        it('filters by handoverAcceptedByOps = false', async () => {
            await getPendingApprovals('Ops')
            const query = mockFindMany.mock.calls[0][0]

            expect(query.where.handoverAcceptedByOps).toBe(false)
        })

        it('excludes programs rejected by ops', async () => {
            await getPendingApprovals('Ops')
            const query = mockFindMany.mock.calls[0][0]

            expect(query.where.OR).toEqual(
                expect.arrayContaining([
                    { rejectionStatus: null },
                    { rejectionStatus: { not: 'rejected_ops' } },
                ])
            )
        })

        it('does NOT show Stage 3+ programs', async () => {
            await getPendingApprovals('Ops')
            const query = mockFindMany.mock.calls[0][0]

            // Ops should only see Stage 1-2
            expect(query.where.currentStage).toEqual({ in: [1, 2] })
        })
    })

    // ─── Admin role queries ───

    describe('Admin role', () => {
        it('queries with OR combining Finance and Ops concerns', async () => {
            await getPendingApprovals('Admin')
            const query = mockFindMany.mock.calls[0][0]

            expect(query.where.OR).toBeDefined()
            expect(query.where.OR).toHaveLength(2)
        })

        it('includes finance-pending programs across all active stages', async () => {
            await getPendingApprovals('Admin')
            const query = mockFindMany.mock.calls[0][0]

            // First OR clause: Finance pending
            const financePending = query.where.OR[0]
            expect(financePending.financeApprovalReceived).toBe(false)
            expect(financePending.currentStage).toEqual({ lt: 6 })
            expect(financePending.rejectionStatus).toBeNull()
        })

        it('includes ops-pending programs in Stage 1-2 only', async () => {
            await getPendingApprovals('Admin')
            const query = mockFindMany.mock.calls[0][0]

            // Second OR clause: Ops pending
            const opsPending = query.where.OR[1]
            expect(opsPending.currentStage).toEqual({ in: [1, 2] })
            expect(opsPending.handoverAcceptedByOps).toBe(false)
            expect(opsPending.rejectionStatus).toBeNull()
        })
    })

    // ─── Business Logic: Finance independence ───

    describe('Finance approval independence from stage progression', () => {
        it('Finance pending persists when program moves to Stage 2', async () => {
            // Program moved to Stage 2 by Ops, but Finance hasn't approved
            const programInStage2 = {
                id: '2',
                programName: 'Stage 2 Program',
                currentStage: 2,
                financeApprovalReceived: false,
                handoverAcceptedByOps: true,
                rejectionStatus: null,
            }
            mockFindMany.mockResolvedValue([programInStage2])

            const result = await getPendingApprovals('Finance')
            expect(result.count).toBe(1)
            expect(result.programs[0].currentStage).toBe(2)
        })

        it('Finance pending persists when program moves to Stage 4', async () => {
            const programInStage4 = {
                id: '4',
                programName: 'Stage 4 Program',
                currentStage: 4,
                financeApprovalReceived: false,
                rejectionStatus: null,
            }
            mockFindMany.mockResolvedValue([programInStage4])

            const result = await getPendingApprovals('Finance')
            expect(result.count).toBe(1)
        })

        it('Finance pending does NOT show for Done programs (Stage 6)', async () => {
            await getPendingApprovals('Finance')
            const query = mockFindMany.mock.calls[0][0]

            // Ensure Stage 6 is excluded
            expect(query.where.currentStage).toEqual({ lt: 6 })
        })
    })

    // ─── Edge cases ───

    describe('Edge cases', () => {
        it('returns empty for unknown role', async () => {
            const result = await getPendingApprovals('Sales')
            expect(result.success).toBe(true)
            expect(result.count).toBe(0)
            expect(result.programs).toEqual([])
        })

        it('handles database errors gracefully', async () => {
            mockFindMany.mockRejectedValue(new Error('DB connection failed'))
            const result = await getPendingApprovals('Admin')
            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
        })
    })
})
