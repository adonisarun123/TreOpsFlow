import { auth } from "@/auth"
import { getUsers } from "@/app/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddUserForm } from "./add-user-form"
import { EditUserForm } from "./edit-user-form"

// Server Component for the Page
export default async function TeamPage() {
    const session = await auth()
    const role = (session?.user as { role: string }).role

    if (role !== 'Admin') {
        return <div className="p-8">Unauthorized. Only Admins can view this page.</div>
    }

    const users = await getUsers()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
                <AddUserForm />
            </div>

            <div className="bg-card rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="w-[60px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u: { id: string; name: string; email: string; phone?: string | null; role: string; createdAt: Date; active: boolean }) => (
                            <TableRow key={u.id} className={!u.active ? 'opacity-50' : ''}>
                                <TableCell className="font-medium">{u.name}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                        ${u.role === 'Admin' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' : ''}
                                        ${u.role === 'Sales' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : ''}
                                        ${u.role === 'Ops' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' : ''}
                                        ${u.role === 'Finance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' : ''}
                                    `}>
                                        {u.role}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.active ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                        {u.active ? 'Active' : 'Inactive'}
                                    </span>
                                </TableCell>
                                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <EditUserForm user={u} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
