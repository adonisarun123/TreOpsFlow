import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * Health check endpoint for load balancers and monitoring.
 * Returns database connectivity status and basic system info.
 */
export async function GET() {
    const start = Date.now()

    try {
        // Verify database connectivity
        await prisma.$queryRawUnsafe("SELECT 1")
        const dbLatency = Date.now() - start

        return NextResponse.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: "connected",
                latencyMs: dbLatency,
            },
        })
    } catch (error) {
        return NextResponse.json(
            {
                status: "error",
                timestamp: new Date().toISOString(),
                database: {
                    status: "disconnected",
                    error: error instanceof Error ? error.message : "Unknown database error",
                },
            },
            { status: 503 }
        )
    }
}
