import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"
import { programDeletedEmail } from "@/lib/email-templates"

// Item 11: Admin-only program deletion (with reason + notifications)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user as { role: string; name: string }
    if (user.role !== 'Admin') {
        return NextResponse.json({ error: "Only admins can delete programs" }, { status: 403 })
    }

    const { id } = await params

    // Parse reason from request body
    let reason = ''
    try {
        const body = await request.json()
        reason = body.reason || ''
    } catch {
        // No body provided — proceed without reason for backward compat
    }

    if (reason && reason.length < 10) {
        return NextResponse.json({ error: "Reason must be at least 10 characters" }, { status: 400 })
    }

    try {
        // Fetch program details before deleting
        const program = await prisma.programCard.findUnique({
            where: { id },
            select: { programName: true, programId: true, companyName: true },
        })

        if (!program) {
            return NextResponse.json({ error: "Program not found" }, { status: 404 })
        }

        // Delete related transitions first (FK constraint)
        await prisma.stageTransition.deleteMany({ where: { programCardId: id } })
        // Delete the program
        await prisma.programCard.delete({ where: { id } })

        // Send notification email to all users if reason was provided
        if (reason) {
            const allUsers = await prisma.user.findMany({
                where: { active: true },
                select: { email: true },
            })

            const emailData = programDeletedEmail({
                programName: program.programName,
                programId: program.programId,
                clientName: program.companyName || 'N/A',
                deletedBy: user.name || 'Admin',
                reason,
            })

            // Send to all users (fire-and-forget, don't block response)
            const emails = allUsers.map(u => u.email)
            for (const email of emails) {
                sendEmail({ to: email, ...emailData }).catch(err => {
                    console.error(`[DELETE] Failed to notify ${email}:`, err)
                })
            }
        }

        revalidatePath('/dashboard')
        return NextResponse.json({ success: true, message: "Program deleted" })
    } catch (error) {
        console.error("Delete error:", error)
        return NextResponse.json({ error: "Failed to delete program" }, { status: 500 })
    }
}
