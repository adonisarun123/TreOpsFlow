import { auth } from "@/auth"
import { getPrograms } from "@/app/actions/program"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export const revalidate = 30

export default async function DashboardPage() {
    const session = await auth()
    const user = session?.user as { role?: string; id?: string } | undefined
    const programs = await getPrograms()
    const role = user?.role || 'Sales'
    const userId = user?.id || ''

    return <DashboardView programs={programs} userRole={role} userId={userId} />
}
