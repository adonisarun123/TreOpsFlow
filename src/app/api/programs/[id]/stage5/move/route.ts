import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { canProgressFromStage5 } from "@/lib/validations"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user as any
    const { id } = await params

    try {
        const program = await prisma.programCard.findUnique({ where: { id } })
        if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })
        if (program.currentStage !== 5) return NextResponse.json({ error: "Program is not in Post Trip Closure stage" }, { status: 400 })

        const validation = canProgressFromStage5(program)
        if (!validation.isValid) {
            return NextResponse.json({ error: "Cannot close program:", details: validation.errors }, { status: 400 })
        }

        await prisma.programCard.update({
            where: { id },
            data: {
                currentStage: 6,
                closedAt: new Date(),
                closedBy: user.id,
                locked: true,
            },
        })
        await prisma.stageTransition.create({
            data: { programCardId: id, fromStage: 5, toStage: 6, transitionedBy: user.id, approvalNotes: "Program closed and moved to Done." }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        revalidatePath('/dashboard')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage 5→6 transition error:", error)
        return NextResponse.json({ error: "Failed to close program" }, { status: 500 })
    }
}
