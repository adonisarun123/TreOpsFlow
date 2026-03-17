import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@/types"

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const { email, password } = await loginSchema.parseAsync(credentials)

                const user = await prisma.user.findUnique({
                    where: { email },
                })

                if (!user) {
                    throw new Error("Invalid credentials.")
                }

                // Enforce User.active check — deactivated users cannot log in
                if (!user.active) {
                    throw new Error("Account is deactivated. Contact an administrator.")
                }

                const passwordsMatch = await bcrypt.compare(password, user.password)

                if (!passwordsMatch) {
                    throw new Error("Invalid credentials.")
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role as UserRole,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role as UserRole
                token.id = user.id!
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role
                session.user.id = token.id
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
})
