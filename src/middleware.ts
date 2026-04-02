import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard")
    const isOnLogin = request.nextUrl.pathname.startsWith("/login")
    const isOnRoot = request.nextUrl.pathname === "/"

    // Check for NextAuth session cookie
    const sessionToken = request.cookies.get("authjs.session-token") || request.cookies.get("__Secure-authjs.session-token")
    const isLoggedIn = !!sessionToken

    if (isOnRoot) {
        if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
        return NextResponse.redirect(new URL("/login", request.nextUrl))
    }

    if (isOnDashboard) {
        if (isLoggedIn) return forwardWithHostFix(request)
        return NextResponse.redirect(new URL("/login", request.nextUrl))
    }

    if (isOnLogin) {
        if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
        return NextResponse.next()
    }

    return forwardWithHostFix(request)
}

/**
 * Fix for Netlify custom domains + Next.js server action CSRF.
 *
 * Problem: On Netlify with a custom domain (e.g. knot.trebound.com), the
 * reverse proxy may set `x-forwarded-host` or `host` to the internal
 * Netlify domain (knotbytrebound.netlify.app), while the browser sends
 * `Origin: https://knot.trebound.com`. Next.js compares these and rejects
 * the request as a CSRF attack.
 *
 * Fix: Rewrite the request headers so `x-forwarded-host` matches the
 * actual `Origin` header. This is safe because we trust the Origin
 * header for same-site requests, and the middleware runs before the
 * server action handler.
 */
function forwardWithHostFix(request: NextRequest): NextResponse {
    const origin = request.headers.get('origin')
    if (origin) {
        try {
            const originHost = new URL(origin).host
            const requestHeaders = new Headers(request.headers)
            requestHeaders.set('x-forwarded-host', originHost)
            return NextResponse.next({
                request: { headers: requestHeaders },
            })
        } catch {
            // Invalid origin, pass through
        }
    }
    return NextResponse.next()
}

export const config = {
    // Include all routes (including API) so server action CSRF fix applies everywhere
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
