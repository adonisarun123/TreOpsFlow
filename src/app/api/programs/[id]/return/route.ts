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

    const user = session.user as { id: string; role: string }
    const { id } = await params

    // Only Ops and Admin can return programs
    if (user.role !== 'Ops' && user.role !== 'Admin') {
        return NextResponse.json({ error: "Only Ops or Admin can return programs to previous stages" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { targetStage, reason } = body

        if (!targetStage || !reason?.trim()) {
            return NextResponse.json({ error: "Target stage and reason are required" }, { status: 400 })
        }

        const program = await prisma.programCard.findUnique({ where: { id } })
        if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })

        // Validate: target must be lower than current
        if (targetStage >= program.currentStage) {
            return NextResponse.json({ error: "Target stage must be earlier than current stage" }, { status: 400 })
        }

        // Validate: target must be at least 1
        if (targetStage < 1) {
            return NextResponse.json({ error: "Cannot return to stage below 1" }, { status: 400 })
        }

        // Update the program stage
        await prisma.programCard.update({
            where: { id },
            data: {
                currentStage: targetStage,
                locked: false,
            },
        })

        // Record the transition
        await prisma.stageTransition.create({
            data: {
                programCardId: id,
                fromStage: program.currentStage,
                toStage: targetStage,
                transitionedBy: user.id,
                approvalNotes: `[RETURNED] ${reason.trim()}`,
            },
        })

        revalidatePath(`/dashboard/programs/${id}`)
        revalidatePath('/dashboard')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Return stage error:", error)
        return NextResponse.json({ error: "Failed to return program" }, { status: 500 })
    }
}
