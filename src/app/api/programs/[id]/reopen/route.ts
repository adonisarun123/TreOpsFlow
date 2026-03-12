import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user as any
    if (user.role !== 'Admin') {
        return NextResponse.json({ error: "Only Admin can reopen programs" }, { status: 403 })
    }

    const { id } = await params

    try {
        const program = await prisma.programCard.findUnique({ where: { id } })
        if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })
        if (program.currentStage !== 6) return NextResponse.json({ error: "Program is not in Done stage" }, { status: 400 })

        await prisma.programCard.update({
            where: { id },
            data: {
                currentStage: 5, // Return to Post Trip Closure
                locked: false,
                closedAt: null,
                closedBy: null,
            },
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: id,
                fromStage: 6,
                toStage: 5,
                transitionedBy: user.id,
                approvalNotes: "Program reopened by Admin.",
            },
        })

        revalidatePath(`/dashboard/programs/${id}`)
        revalidatePath('/dashboard')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Reopen error:", error)
        return NextResponse.json({ error: "Failed to reopen program" }, { status: 500 })
    }
}
