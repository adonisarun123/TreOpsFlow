/**
 * Mock Prisma client for tests.
 * Import this in test files: jest.mock('@/lib/prisma', () => require('../__mocks__/prisma'))
 */
export const prisma = {
    programCard: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
    },
    stageTransition: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    appSetting: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    $transaction: jest.fn(),
}
