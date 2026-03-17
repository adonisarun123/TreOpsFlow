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

    const user = session.user
    const { id } = await params

    // Parse form data from request body (sent by Stage5PostTripForm)
    let body: any = {}
    try {
        body = await request.json()
    } catch {
        // Empty body is OK — validation will run against existing DB data
    }

    try {
        const program = await prisma.programCard.findUnique({ where: { id } })
        if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })

        // Accept programs at Stage 4 or 5 — move forward by one step
        if (program.currentStage !== 5 && program.currentStage !== 4) {
            return NextResponse.json({ error: "Program must be in Stage 4 or 5 to use this action" }, { status: 400 })
        }

        // Merge incoming form data with existing program for validation
        // Handle zfdRating parsing before merge
        const parsedBody = {
            ...body,
            ...(body.zfdRating !== undefined ? { zfdRating: body.zfdRating ? parseInt(body.zfdRating) : null } : {}),
        }
        const merged = { ...program, ...parsedBody }
        const validation = canProgressFromStage5(merged)
        if (!validation.isValid) {
            return NextResponse.json({ error: "Cannot close program:", details: validation.errors }, { status: 400 })
        }

        const nextStage = program.currentStage + 1
        const isFinalClose = nextStage === 6

        // Save form data + advance stage atomically
        await prisma.programCard.update({
            where: { id },
            data: {
                googleReviewDone: body.googleReviewDone ?? program.googleReviewDone,
                videoReviewDone: body.videoReviewDone ?? program.videoReviewDone,
                sharePicsToClient: body.sharePicsToClient ?? program.sharePicsToClient,
                opsDataEntryDone: body.opsDataEntryDone ?? program.opsDataEntryDone,
                tripExpensesBillsSubmittedToFinance: body.tripExpensesBillsSubmittedToFinance ?? program.tripExpensesBillsSubmittedToFinance,
                opsExpenseStatementSubmittedToSales: body.opsExpenseStatementSubmittedToSales ?? program.opsExpenseStatementSubmittedToSales,
                logisticsUnpackingDone: body.logisticsUnpackingDone ?? program.logisticsUnpackingDone,
                logisticsUnpackingComment: body.logisticsUnpackingComment ?? program.logisticsUnpackingComment,
                zfdRating: body.zfdRating !== undefined ? (body.zfdRating ? parseInt(body.zfdRating) : null) : program.zfdRating,
                zfdComments: body.zfdComments ?? program.zfdComments,
                currentStage: nextStage,
                ...(isFinalClose ? { closedAt: new Date(), closedBy: user.id, locked: true } : {}),
            },
        })

        await prisma.stageTransition.create({
            data: { programCardId: id, fromStage: program.currentStage, toStage: nextStage, transitionedBy: user.id, approvalNotes: isFinalClose ? "Program closed and moved to Done." : "Moved to Post Trip Closure." }
        })

        revalidatePath(`/dashboard/programs/${id}`)
        revalidatePath('/dashboard')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage transition error:", error)
        return NextResponse.json({ error: "Failed to transition stage" }, { status: 500 })
    }
}
