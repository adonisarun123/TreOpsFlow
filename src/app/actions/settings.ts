'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getAppSettings() {
    const session = await auth()
    if (!session) return []
    return await prisma.appSetting.findMany()
}

export async function getAppSetting(key: string) {
    const session = await auth()
    if (!session) return null
    return await prisma.appSetting.findUnique({ where: { key } })
}

export async function updateAppSetting(key: string, value: string) {
    const session = await auth()
    if ((session?.user as any)?.role !== 'Admin') {
        return { error: "Unauthorized — only Admins can update settings" }
    }

    if (!key || !value.trim()) {
        return { error: "Key and value are required" }
    }

    try {
        await prisma.appSetting.upsert({
            where: { key },
            update: { value: value.trim() },
            create: { key, value: value.trim(), label: key },
        })
        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (e) {
        return { error: "Failed to update setting" }
    }
}
