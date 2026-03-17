import { auth } from "@/auth"
import { getProgramsPaginated } from "@/app/actions/program"
import { ProgramsTable } from "@/components/dashboard/programs-table"
import { redirect } from "next/navigation"

interface PageProps {
    searchParams: Promise<{
        page?: string
        pageSize?: string
        stage?: string
        search?: string
    }>
}

export default async function AllProgramsPage({ searchParams }: PageProps) {
    const session = await auth()
    if (!session) {
        redirect('/login')
    }

    const params = await searchParams
    const user = session?.user as any
    const role = user?.role || 'Sales'

    const page = parseInt(params.page || '1', 10)
    const pageSize = parseInt(params.pageSize || '25', 10)
    const stage = params.stage ? parseInt(params.stage, 10) : undefined
    const search = params.search || undefined

    const result = await getProgramsPaginated({ page, pageSize, stage, search })

    return (
        <ProgramsTable
            programs={result.programs}
            userRole={role}
            pagination={{
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages,
            }}
        />
    )
}
