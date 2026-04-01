"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { updateUser } from "@/app/actions/admin"
import { Loader2, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { showToast } from "@/components/ui/toaster"

interface EditUserFormProps {
    user: {
        id: string
        name: string
        email: string
        phone?: string | null
        role: string
        active: boolean
    }
}

export function EditUserForm({ user }: EditUserFormProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const data = {
            id: user.id,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string || undefined,
            role: formData.get('role') as "Admin" | "Sales" | "Ops" | "Finance",
            active: formData.get('active') === 'on',
            password: formData.get('password') as string || '',
        }

        const result = await updateUser(data)
        if (result.error) {
            showToast(result.error, "error")
        } else {
            showToast("User updated successfully", "success")
            setOpen(false)
            router.refresh()
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User — {user.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input name="name" required defaultValue={user.name} />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input name="email" type="email" required defaultValue={user.email} />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input name="phone" type="tel" defaultValue={user.phone || ''} placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select name="role" required defaultValue={user.role}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sales">Sales</SelectItem>
                                <SelectItem value="Ops">Ops</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Reset Password <span className="text-xs text-muted-foreground">(leave blank to keep current)</span></Label>
                        <Input name="password" type="password" minLength={6} placeholder="New password (min 6 chars)" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="active"
                            id={`active-${user.id}`}
                            defaultChecked={user.active}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`active-${user.id}`} className="text-sm font-normal">Active account</Label>
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
