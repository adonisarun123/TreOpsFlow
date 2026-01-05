import { ProgramForm } from "@/components/forms/program-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewProgramPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Create New Program</h2>
                <p className="text-muted-foreground">Initiate a new program card. This will start in Stage 1.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Program Details</CardTitle>
                    <CardDescription>Enter the initial details for the program handover.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProgramForm />
                </CardContent>
            </Card>
        </div>
    )
}
