const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
        '<rootDir>/__tests__/**/*.test.ts',
        '<rootDir>/__tests__/**/*.test.tsx',
    ],
}

module.exports = createJestConfig(config)
