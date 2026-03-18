import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const settings = await prisma.appSetting.findMany()
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))

    return NextResponse.json(map)
}
