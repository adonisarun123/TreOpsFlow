/**
 * Tests for optimized admin dashboard queries.
 * Verifies that getDashboardStats, getRevenueByType, getMonthlyRevenue
 * use batched queries ($transaction, groupBy) instead of N+1 patterns.
 */

const mockTransaction = jest.fn()
const mockGroupBy = jest.fn()
const mockAggregate = jest.fn()
const mockCount = jest.fn()
const mockFindMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
    prisma: {
        programCard: {
            count: (...args: any[]) => mockCount(...args),
            aggregate: (...args: any[]) => mockAggregate(...args),
            groupBy: (...args: any[]) => mockGroupBy(...args),
            findMany: (...args: any[]) => mockFindMany(...args),
        },
        stageTransition: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        $transaction: (...args: any[]) => mockTransaction(...args),
    },
}))

const mockAuth = jest.fn()
jest.mock('@/auth', () => ({
    auth: () => mockAuth(),
}))

import { getDashboardStats, getRevenueByType, getMonthlyRevenue, getFacilitatorWorkload } from '@/app/actions/admin'

describe('getDashboardStats', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
    })

    it('returns null when not authenticated', async () => {
        mockAuth.mockResolvedValue(null)
        const result = await getDashboardStats()
        expect(result).toBeNull()
    })

    it('uses a single $transaction for all queries', async () => {
        const mockResults = [
            10,  // totalPrograms
            7,   // activePrograms
            2,   // completedPrograms
            3,   // pendingPrograms
            { _sum: { deliveryBudget: 500000 } },  // pipelineRevenue
            { _sum: { deliveryBudget: 200000 } },  // completedRevenue
            [{ currentStage: 1, _count: { _all: 3 } }, { currentStage: 2, _count: { _all: 2 } }], // stageDistribution
            { _sum: { deliveryBudget: 100000 } },  // thisMonthRevenue
            { _sum: { deliveryBudget: 80000 } },   // lastMonthRevenue
            5,   // weeklyNew
        ]
        mockTransaction.mockResolvedValue(mockResults)

        const result = await getDashboardStats()

        // Should call $transaction exactly once
        expect(mockTransaction).toHaveBeenCalledTimes(1)

        // The transaction should contain an array of Prisma queries
        const transactionArg = mockTransaction.mock.calls[0][0]
        expect(Array.isArray(transactionArg)).toBe(true)

        // Verify result structure
        expect(result).not.toBeNull()
        expect(result!.totalPrograms).toBe(10)
        expect(result!.activePrograms).toBe(7)
        expect(result!.completedPrograms).toBe(2)
        expect(result!.pendingPrograms).toBe(3)
        expect(result!.pipelineRevenue).toBe(500000)
        expect(result!.completedRevenue).toBe(200000)
        expect(result!.weeklyNew).toBe(5)
    })

    it('correctly builds stage counts from groupBy result', async () => {
        const mockResults = [
            10, 7, 2, 3,
            { _sum: { deliveryBudget: 500000 } },
            { _sum: { deliveryBudget: 200000 } },
            [
                { currentStage: 1, _count: { _all: 3 } },
                { currentStage: 2, _count: { _all: 2 } },
                { currentStage: 4, _count: { _all: 1 } },
                { currentStage: 6, _count: { _all: 2 } },
            ],
            { _sum: { deliveryBudget: 100000 } },
            { _sum: { deliveryBudget: 80000 } },
            5,
        ]
        mockTransaction.mockResolvedValue(mockResults)

        const result = await getDashboardStats()

        expect(result!.stageCounts).toEqual([
            { stage: 1, count: 3 },
            { stage: 2, count: 2 },
            { stage: 3, count: 0 },  // Missing = 0
            { stage: 4, count: 1 },
            { stage: 5, count: 0 },  // Missing = 0
            { stage: 6, count: 2 },
        ])
    })

    it('calculates growth percentage correctly', async () => {
        const mockResults = [
            10, 7, 2, 3,
            { _sum: { deliveryBudget: 500000 } },
            { _sum: { deliveryBudget: 200000 } },
            [],
            { _sum: { deliveryBudget: 150000 } },  // this month
            { _sum: { deliveryBudget: 100000 } },   // last month
            5,
        ]
        mockTransaction.mockResolvedValue(mockResults)

        const result = await getDashboardStats()

        // Growth: (150000 - 100000) / 100000 * 100 = 50%
        expect(result!.growthPct).toBe(50)
    })

    it('handles zero last month revenue (no division by zero)', async () => {
        const mockResults = [
            10, 7, 2, 3,
            { _sum: { deliveryBudget: 500000 } },
            { _sum: { deliveryBudget: 200000 } },
            [],
            { _sum: { deliveryBudget: 100000 } },
            { _sum: { deliveryBudget: 0 } },  // Zero last month
            5,
        ]
        mockTransaction.mockResolvedValue(mockResults)

        const result = await getDashboardStats()
        expect(result!.growthPct).toBe(0) // No division by zero
    })

    it('handles null deliveryBudget sums', async () => {
        const mockResults = [
            0, 0, 0, 0,
            { _sum: { deliveryBudget: null } },
            { _sum: { deliveryBudget: null } },
            [],
            { _sum: { deliveryBudget: null } },
            { _sum: { deliveryBudget: null } },
            0,
        ]
        mockTransaction.mockResolvedValue(mockResults)

        const result = await getDashboardStats()
        expect(result!.pipelineRevenue).toBe(0)
        expect(result!.completedRevenue).toBe(0)
        expect(result!.thisMonthRevenue).toBe(0)
        expect(result!.lastMonthRevenue).toBe(0)
    })
})

describe('getRevenueByType', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
    })

    it('returns empty array when not authenticated', async () => {
        mockAuth.mockResolvedValue(null)
        const result = await getRevenueByType()
        expect(result).toEqual([])
    })

    it('uses groupBy instead of findMany', async () => {
        mockGroupBy.mockResolvedValue([
            { programType: 'Team Building', _sum: { deliveryBudget: 300000 }, _count: { _all: 5 } },
            { programType: 'Corporate Outing', _sum: { deliveryBudget: 200000 }, _count: { _all: 3 } },
        ])

        const result = await getRevenueByType()

        expect(mockGroupBy).toHaveBeenCalledWith(
            expect.objectContaining({
                by: ['programType'],
                _sum: { deliveryBudget: true },
                _count: { _all: true },
            })
        )
        expect(mockFindMany).not.toHaveBeenCalled()

        expect(result).toEqual([
            { type: 'Team Building', revenue: 300000, count: 5 },
            { type: 'Corporate Outing', revenue: 200000, count: 3 },
        ])
    })

    it('sorts by revenue descending', async () => {
        mockGroupBy.mockResolvedValue([
            { programType: 'Small', _sum: { deliveryBudget: 50000 }, _count: { _all: 1 } },
            { programType: 'Large', _sum: { deliveryBudget: 500000 }, _count: { _all: 5 } },
        ])

        const result = await getRevenueByType()
        expect(result[0].type).toBe('Large')
        expect(result[1].type).toBe('Small')
    })

    it('handles null programType as "Unspecified"', async () => {
        mockGroupBy.mockResolvedValue([
            { programType: null, _sum: { deliveryBudget: 100000 }, _count: { _all: 2 } },
        ])

        const result = await getRevenueByType()
        expect(result[0].type).toBe('Unspecified')
    })
})

describe('getMonthlyRevenue', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
    })

    it('returns empty array when not authenticated', async () => {
        mockAuth.mockResolvedValue(null)
        const result = await getMonthlyRevenue()
        expect(result).toEqual([])
    })

    it('uses $transaction for batched monthly queries', async () => {
        const monthlyResults = Array.from({ length: 6 }, () => ({
            _sum: { deliveryBudget: 100000 },
            _count: 10,
        }))
        mockTransaction.mockResolvedValue(monthlyResults)

        const result = await getMonthlyRevenue()

        expect(mockTransaction).toHaveBeenCalledTimes(1)
        expect(result).toHaveLength(6) // 6 months
        result.forEach(month => {
            expect(month).toHaveProperty('month')
            expect(month).toHaveProperty('revenue')
            expect(month).toHaveProperty('count')
        })
    })

    it('handles null revenue sums as 0', async () => {
        const monthlyResults = Array.from({ length: 6 }, () => ({
            _sum: { deliveryBudget: null },
            _count: 0,
        }))
        mockTransaction.mockResolvedValue(monthlyResults)

        const result = await getMonthlyRevenue()
        result.forEach(month => {
            expect(month.revenue).toBe(0)
            expect(month.count).toBe(0)
        })
    })
})

describe('getFacilitatorWorkload', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockAuth.mockResolvedValue({ user: { role: 'Admin' } })
    })

    it('returns empty array when not authenticated', async () => {
        mockAuth.mockResolvedValue(null)
        const result = await getFacilitatorWorkload()
        expect(result).toEqual([])
    })

    it('aggregates programs by facilitator', async () => {
        mockFindMany.mockResolvedValue([
            { opsSPOCAssignedName: 'Sharath', deliveryBudget: 100000, currentStage: 3 },
            { opsSPOCAssignedName: 'Sharath', deliveryBudget: 200000, currentStage: 6 },
            { opsSPOCAssignedName: 'Nels', deliveryBudget: 150000, currentStage: 4 },
        ])

        const result = await getFacilitatorWorkload()

        expect(result).toHaveLength(2)

        const sharath = result.find((f: any) => f.name === 'Sharath')
        expect(sharath).toBeDefined()
        expect(sharath!.total).toBe(2)
        expect(sharath!.active).toBe(1)
        expect(sharath!.completed).toBe(1)
        expect(sharath!.revenue).toBe(300000)
    })

    it('sorts by active programs descending', async () => {
        mockFindMany.mockResolvedValue([
            { opsSPOCAssignedName: 'A', deliveryBudget: 100000, currentStage: 3 },
            { opsSPOCAssignedName: 'B', deliveryBudget: 100000, currentStage: 3 },
            { opsSPOCAssignedName: 'B', deliveryBudget: 100000, currentStage: 4 },
        ])

        const result = await getFacilitatorWorkload()
        expect(result[0].name).toBe('B') // 2 active
        expect(result[1].name).toBe('A') // 1 active
    })
})
