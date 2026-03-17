/**
 * Simple in-memory sliding window rate limiter.
 * For multi-instance production deployments, replace with Redis-based rate limiting.
 */

interface RateLimitEntry {
    timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now

    const cutoff = now - windowMs
    for (const [key, entry] of store.entries()) {
        entry.timestamps = entry.timestamps.filter(t => t > cutoff)
        if (entry.timestamps.length === 0) {
            store.delete(key)
        }
    }
}

/**
 * Check if a request from the given key should be rate limited.
 *
 * @param key - Unique identifier (e.g., IP address)
 * @param maxRequests - Maximum requests allowed within the window
 * @param windowMs - Time window in milliseconds
 * @returns { limited: boolean, remaining: number, retryAfterMs: number }
 */
export function rateLimit(
    key: string,
    maxRequests: number = 10,
    windowMs: number = 60_000
): { limited: boolean; remaining: number; retryAfterMs: number } {
    cleanup(windowMs)

    const now = Date.now()
    const cutoff = now - windowMs

    let entry = store.get(key)
    if (!entry) {
        entry = { timestamps: [] }
        store.set(key, entry)
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => t > cutoff)

    if (entry.timestamps.length >= maxRequests) {
        const oldestInWindow = entry.timestamps[0]
        const retryAfterMs = oldestInWindow + windowMs - now
        return {
            limited: true,
            remaining: 0,
            retryAfterMs: Math.max(0, retryAfterMs),
        }
    }

    entry.timestamps.push(now)
    return {
        limited: false,
        remaining: maxRequests - entry.timestamps.length,
        retryAfterMs: 0,
    }
}

/**
 * Extract client IP from request headers.
 * Works with Netlify, Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        request.headers.get("cf-connecting-ip") ||
        "unknown"
    )
}
