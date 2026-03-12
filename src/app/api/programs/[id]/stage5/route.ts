import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    try {
        await prisma.programCard.update({
            where: { id },
            data: {
                googleReviewDone: body.googleReviewDone,
                videoReviewDone: body.videoReviewDone,
                sharePicsToClient: body.sharePicsToClient,
                opsDataEntryDone: body.opsDataEntryDone,
                tripExpensesBillsSubmittedToFinance: body.tripExpensesBillsSubmittedToFinance,
                opsExpenseStatementSubmittedToSales: body.opsExpenseStatementSubmittedToSales,
                logisticsUnpackingDone: body.logisticsUnpackingDone,
                logisticsUnpackingComment: body.logisticsUnpackingComment,
                zfdRating: body.zfdRating ? parseInt(body.zfdRating) : null,
                zfdComments: body.zfdComments,
            },
        })

        revalidatePath(`/dashboard/programs/${id}`)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Stage 5 update error:", error)
        return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }
}
