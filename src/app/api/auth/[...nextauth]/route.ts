import { handlers } from "@/auth"
import { NextResponse } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const { GET: originalGET, POST: originalPOST } = handlers

// Rate limit auth POST requests (login attempts): 10 per minute per IP
export async function POST(request: Request, context: any) {
    const ip = getClientIp(request)
    const result = rateLimit(`auth:${ip}`, 10, 60_000)

    if (result.limited) {
        return NextResponse.json(
            { error: "Too many login attempts. Please try again later." },
            {
                status: 429,
                headers: {
                    "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
                    "X-RateLimit-Remaining": "0",
                },
            }
        )
    }

    return originalPOST(request, context)
}

// GET requests (session checks) — lighter rate limiting: 30 per minute
export async function GET(request: Request, context: any) {
    const ip = getClientIp(request)
    const result = rateLimit(`auth-get:${ip}`, 30, 60_000)

    if (result.limited) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } }
        )
    }

    return originalGET(request, context)
}
