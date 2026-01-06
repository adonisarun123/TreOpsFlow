import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUsers, createUser } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { AddUserForm } from "./add-user-form"

// Server Component for the Page
export default async function TeamPage() {
    const session = await auth()
    const role = (session?.user as any).role

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

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u: any) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.name}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                        ${u.role === 'Admin' ? 'bg-red-100 text-red-800' : ''}
                                        ${u.role === 'Sales' ? 'bg-blue-100 text-blue-800' : ''}
                                        ${u.role === 'Ops' ? 'bg-green-100 text-green-800' : ''}
                                        ${u.role === 'Finance' ? 'bg-yellow-100 text-yellow-800' : ''}
                                    `}>
                                        {u.role}
                                    </span>
                                </TableCell>
                                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
