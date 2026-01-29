import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard")
    const isOnLogin = request.nextUrl.pathname.startsWith("/login")

    // Check for NextAuth session cookie
    const sessionToken = request.cookies.get("authjs.session-token") || request.cookies.get("__Secure-authjs.session-token")
    const isLoggedIn = !!sessionToken

    if (isOnDashboard) {
        if (isLoggedIn) return NextResponse.next() // Allow access
        return NextResponse.redirect(new URL("/login", request.nextUrl)) // Redirect unauthenticated users to login page
    }

    if (isOnLogin) {
        if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", request.nextUrl)) // Redirect authenticated users to dashboard
        return NextResponse.next() // Allow access to login page
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
