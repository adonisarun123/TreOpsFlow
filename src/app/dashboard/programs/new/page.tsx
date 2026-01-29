import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Stage1Form } from "@/components/forms/stage1-form"

export default async function NewProgramPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    const userRole = (session.user as any)?.role

    // Only Sales and Admin can create programs
    if (userRole !== "Sales" && userRole !== "Admin") {
        redirect("/dashboard")
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Create New Program</h1>
                <p className="text-gray-600 mt-2">
                    Fill in the program details below to create a new program card
                </p>
            </div>

            <Stage1Form />
        </div>
    )
}
