import { NextResponse } from "next/server"

/**
 * Verifies that a cron request includes a valid CRON_SECRET.
 * Checks the Authorization header (Bearer token) or `secret` query parameter.
 *
 * Usage:
 *   const authError = verifyCronSecret(request)
 *   if (authError) return authError
 */
export function verifyCronSecret(request: Request): NextResponse | null {
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
        console.error("CRON_SECRET environment variable is not set")
        return NextResponse.json(
            { error: "Server misconfiguration: cron secret not set" },
            { status: 500 }
        )
    }

    // Check Authorization: Bearer <token> header
    const authHeader = request.headers.get("authorization")
    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, "")
        if (token === cronSecret) {
            return null // Authorized
        }
    }

    // Check ?secret=<token> query parameter (for simple cron services)
    const url = new URL(request.url)
    const querySecret = url.searchParams.get("secret")
    if (querySecret === cronSecret) {
        return null // Authorized
    }

    return NextResponse.json(
        { error: "Unauthorized: invalid or missing cron secret" },
        { status: 401 }
    )
}
