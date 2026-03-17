import type { UserRole } from "@/types"
import type { DefaultSession, DefaultUser } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    interface User extends DefaultUser {
        role: UserRole
    }

    interface Session {
        user: {
            id: string
            role: UserRole
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        role: UserRole
        id: string
    }
}
