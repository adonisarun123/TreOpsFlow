"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2, Mail, Lock } from "lucide-react"
import Image from "next/image"

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(1, {
        message: "Password is required.",
    }),
})

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            const res = await signIn("credentials", {
                email: values.email,
                password: values.password,
                redirect: false,
            })

            if (res?.error) {
                setError("Invalid email or password")
            } else {
                router.push("/dashboard")
                router.refresh()
            }
        } catch (e) {
            setError("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left: Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzEzIDAgNiAyLjY4NiA2IDZzLTIuNjg3IDYtNiA2LTYtMi42ODYtNi02IDIuNjg3LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Image src="/logo.png" alt="Knot by Trebound" width={44} height={44} className="rounded-xl" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Knot</h1>
                                <p className="text-indigo-200 text-sm -mt-0.5">by Trebound</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold text-white leading-tight">
                            The point where all<br />
                            the strings are tied<br />
                            together.
                        </h2>
                        <p className="text-indigo-200 text-lg leading-relaxed max-w-md">
                            Track programs from tentative handover through delivery to post-trip closure — all in one place.
                        </p>

                        <div className="flex gap-3 pt-4">
                            {["Tentative", "Accepted", "Feasibility", "Delivery", "Post Trip", "Done"].map((stage, i) => (
                                <div key={stage} className="flex items-center gap-1.5">
                                    <div className={`h-2 w-2 rounded-full ${
                                        ["bg-amber-400", "bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-orange-400", "bg-slate-400"][i]
                                    }`} />
                                    <span className="text-xs text-indigo-300/80">{stage}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-indigo-400 text-xs">© 2026 Knot by Trebound. Internal System.</p>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
                        <Image src="/logo.png" alt="Knot by Trebound" width={38} height={38} className="rounded-xl" />
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Knot</h1>
                            <p className="text-xs text-muted-foreground -mt-0.5">by Trebound</p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                        <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    className="pl-10 h-11 bg-muted/50 border-border"
                                                    placeholder="you@trebound.com"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    className="pl-10 h-11 bg-muted/50 border-border"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 bg-primary hover:bg-primary/90 shadow-sm text-sm font-semibold"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Sign In
                            </Button>
                        </form>
                    </Form>

                    <p className="text-center text-xs text-muted-foreground mt-8">
                        Knot by Trebound — The point where all the strings are tied together.
                    </p>
                </div>
            </div>
        </div>
    )
}
