import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
    const isOnLogin = req.nextUrl.pathname.startsWith("/login")

    if (isOnDashboard) {
        if (isLoggedIn) return NextResponse.next() // Allow access
        return NextResponse.redirect(new URL("/login", req.nextUrl)) // Redirect unauthenticated users to login page
    }

    if (isOnLogin) {
        if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", req.nextUrl)) // Redirect authenticated users to dashboard
        return NextResponse.next() // Allow access to login page
    }

    return NextResponse.next()
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
