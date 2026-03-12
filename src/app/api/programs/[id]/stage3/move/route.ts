import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { canProgressFromStage3 } from "@/lib/validations"

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
        if (program.currentStage !== 3) return NextResponse.json({ error: "Program is not in Feasibility stage" }, { status: 400 })

        const validation = canProgressFromStage3(program)
        if (!validation.isValid) {
            return NextResponse.json({ error: "Cannot move to Delivery:", details: validation.errors }, { status: 400 })
        }

        await prisma.programCard.update({ where: { id }, data: { currentStage: 4 } })
        await prisma.stageTransition.create({
            data: { programCardId: id, fromStage: 3, toStage: 4, transitionedBy: user.id, approvalNotes: "Moved to Delivery." }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        revalidatePath('/dashboard')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage 3→4 transition error:", error)
        return NextResponse.json({ error: "Failed to move to Delivery" }, { status: 500 })
    }
}
