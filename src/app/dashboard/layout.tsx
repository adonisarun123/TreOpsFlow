import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:block">
                <div className="p-6 h-full flex flex-col">
                    <div className="mb-8">
                        <h1 className="text-xl font-bold text-blue-600">Trebound Ops</h1>
                        <p className="text-xs text-gray-500 mt-1">Logged in as {(session.user as any).role}</p>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                            Dashboard
                        </Link>
                        <Link href="/dashboard/programs" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                            All Programs
                        </Link>
                    </nav>

                    <div className="mt-auto">
                        <form
                            action={async () => {
                                "use server"
                                await signOut()
                            }}
                        >
                            <Button variant="outline" className="w-full">Sign Out</Button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    )
}
