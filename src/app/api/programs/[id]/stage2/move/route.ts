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

    const user = session.user
    if (user.role !== 'Ops' && user.role !== 'Admin') {
        return NextResponse.json({ error: "Only Ops or Admin can move to Feasibility" }, { status: 403 })
    }

    const { id } = await params

    // Parse form data from request body (sent by Stage2AcceptedForm)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: Record<string, any> = {}
    try {
        body = await request.json()
    } catch {
        // Empty body is OK — validation will run against existing DB data
    }

    try {
        const program = await prisma.programCard.findUnique({ where: { id } })
        if (!program) {
            return NextResponse.json({ error: "Program not found" }, { status: 404 })
        }

        // Accept programs at Stage 1 or 2 — move them forward by one step
        if (program.currentStage !== 2 && program.currentStage !== 1) {
            return NextResponse.json({ error: "Program must be in Stage 1 or 2 to use this action" }, { status: 400 })
        }

        // Merge incoming form data with existing program for validation
        const merged = { ...program, ...body }
        const validation = canProgressFromStage2(merged)
        if (!validation.isValid) {
            return NextResponse.json({
                error: "Cannot move forward. Missing requirements:",
                details: validation.errors,
            }, { status: 400 })
        }

        const nextStage = program.currentStage + 1

        // Save form data + set handoverAcceptedByOps + advance stage atomically
        await prisma.programCard.update({
            where: { id },
            data: {
                opsSPOCAssignedName: body.opsSPOCAssignedName ?? program.opsSPOCAssignedName,
                handoverChecklistCompleted: body.handoverChecklistCompleted ?? program.handoverChecklistCompleted,
                meetingWithSalesDone: body.meetingWithSalesDone ?? program.meetingWithSalesDone,
                opsComments: body.opsComments ?? program.opsComments,
                handoverAcceptedByOps: true,
                currentStage: nextStage,
            },
        })

        await prisma.stageTransition.create({
            data: {
                programCardId: id,
                fromStage: program.currentStage,
                toStage: nextStage,
                transitionedBy: user.id,
                approvalNotes: `Moved to ${nextStage === 2 ? 'Accepted Handover' : 'Feasibility Check & Preps'}.`,
            },
        })

        revalidatePath(`/dashboard/programs/${id}`)
        revalidatePath('/dashboard')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage transition error:", error)
        return NextResponse.json({ error: "Failed to transition stage" }, { status: 500 })
    }
}
