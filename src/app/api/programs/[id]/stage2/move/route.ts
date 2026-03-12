import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { canProgressFromStage2 } from "@/lib/validations"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== 'Ops' && user.role !== 'Admin') {
        return NextResponse.json({ error: "Only Ops or Admin can move to Feasibility" }, { status: 403 })
    }

    const { id } = await params

    try {
        const program = await prisma.programCard.findUnique({ where: { id } })
        if (!program) {
            return NextResponse.json({ error: "Program not found" }, { status: 404 })
        }

        if (program.currentStage !== 2) {
            return NextResponse.json({ error: "Program is not in Accepted Handover stage" }, { status: 400 })
        }

        const validation = canProgressFromStage2(program)
        if (!validation.isValid) {
            return NextResponse.json({
                error: "Cannot move to Feasibility. Missing requirements:",
                details: validation.errors,
            }, { status: 400 })
        }

        await prisma.programCard.update({
            where: { id },
            data: { currentStage: 3 },
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: id,
                fromStage: 2,
                toStage: 3,
                transitionedBy: user.id,
                approvalNotes: "Moved to Feasibility Check & Preps.",
            },
        })

        revalidatePath(`/dashboard/programs/${id}`)
        revalidatePath('/dashboard')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage 2→3 transition error:", error)
        return NextResponse.json({ error: "Failed to move to Feasibility" }, { status: 500 })
    }
}
