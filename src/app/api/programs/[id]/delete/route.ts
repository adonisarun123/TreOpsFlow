import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// Item 11: Admin-only program deletion
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user as { role: string }
    if (user.role !== 'Admin') {
        return NextResponse.json({ error: "Only admins can delete programs" }, { status: 403 })
    }

    const { id } = await params

    try {
        // Delete related transitions first (FK constraint)
        await prisma.stageTransition.deleteMany({ where: { programCardId: id } })
        // Delete the program
        await prisma.programCard.delete({ where: { id } })

        revalidatePath('/dashboard')
        return NextResponse.json({ success: true, message: "Program deleted" })
    } catch (error) {
        console.error("Delete error:", error)
        return NextResponse.json({ error: "Failed to delete program" }, { status: 500 })
    }
}
