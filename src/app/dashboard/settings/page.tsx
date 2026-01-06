import { auth } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default async function SettingsPage() {
    const session = await auth()
    const user = session?.user as any

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Name</Label>
                        <Input disabled value={user.name} />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Email</Label>
                        <Input disabled value={user.email} />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Role</Label>
                        <Input disabled value={user.role} className="bg-slate-100" />
                    </div>
                </CardContent>
            </Card>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>System wide configuration (Admin Only)</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">No settings available yet.</p>
                </CardContent>
            </Card>
        </div>
    )
}
