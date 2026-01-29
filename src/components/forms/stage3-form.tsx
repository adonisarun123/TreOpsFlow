"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { updateStage3, moveToStage4 } from "@/app/actions/stage3"
import { useRouter } from "next/navigation"
import { Loader2, Save, ArrowRight, CheckSquare } from "lucide-react"
import { showToast } from "@/components/ui/toaster"
import { FileUpload } from "@/components/ui/file-upload"

const stage3Schema = z.object({
    venueReached: z.boolean().default(false),
    facilitatorsReached: z.boolean().default(false),
    programCompleted: z.boolean().default(false),
    deliveryNotes: z.string().optional(),
    initialExpenseSheet: z.string().optional(),
    tripExpenseSheet: z.string().optional(),
    packingCheckDone: z.boolean().default(false),
    actualParticipantCount: z.coerce.number().optional(),
    medicalIssues: z.boolean().default(false),
    medicalIssuesDetails: z.string().optional(),
    facilitatorRemarks: z.string().optional(),
    bdLeadGenDone: z.boolean().default(false),
    activitiesExecuted: z.string().optional(),
})

export function Stage3Form({ program, isReadOnly = false }: { program: any, isReadOnly?: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage3Schema>>({
        resolver: zodResolver(stage3Schema) as any,
        defaultValues: {
            venueReached: program.venueReached || false,
            facilitatorsReached: program.facilitatorsReached || false,
            programCompleted: program.programCompleted || false,
            deliveryNotes: program.deliveryNotes || "",
            initialExpenseSheet: program.initialExpenseSheet || "",
            tripExpenseSheet: program.tripExpenseSheet || "",
            packingCheckDone: program.packingCheckDone || false,
            actualParticipantCount: program.actualParticipantCount ?? '',
            medicalIssues: program.medicalIssues || false,
            medicalIssuesDetails: program.medicalIssuesDetails || "",
            facilitatorRemarks: program.facilitatorRemarks || "",
            bdLeadGenDone: program.bdLeadGenDone || false,
            activitiesExecuted: program.activitiesExecuted || "",
        },
    })

    async function onSave(values: z.infer<typeof stage3Schema>) {
        setIsLoading(true)
        try {
            const result = await updateStage3(program.id, values)
            if (result.error) {
                showToast(`Error: ${result.error}`, "error")
            } else {
                showToast("Saved successfully", "success")
                router.refresh()
            }
        } catch (error: any) {
            const errorMsg = error?.message || error?.toString() || "Failed to save"
            showToast(`Error: ${errorMsg}`, "error")
            console.error("Save error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function onCompleteStage() {
        setIsTransitioning(true)
        const result = await moveToStage4(program.id)

        console.log('🔄 Stage 3→4 transition result:', result)

        if (result.error) {
            let errorMsg = result.error

            if ((result as any).details && Array.isArray((result as any).details) && (result as any).details.length > 0) {
                errorMsg += '\n\nMissing requirements:\n• ' + (result as any).details.join('\n• ')
            }

            console.error("Stage 3→4 transition error:", result)
            showToast(errorMsg, "error")
        } else {
            showToast("Moved to Stage 4 successfully", "success")
            console.log('✅ Successfully moved to Stage 4')
            router.refresh()
        }
        setIsTransitioning(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 border p-6 rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        Stage 3: Delivery Execution
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Checklists */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">On-Site Checklist</h4>
                        <FormField
                            control={form.control}
                            name="venueReached"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Venue Reached</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="facilitatorsReached"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Facilitators Reached</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="programCompleted"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Program Completed</FormLabel>
                                        <FormDescription>Mark when event is totally finished.</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Notes & File */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Closure Docs</h4>

                        <FormField
                            control={form.control}
                            name="deliveryNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Delivery Notes / Incidents</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any issues or special notes..." className="h-24" {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="initialExpenseSheet"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Initial Expense Sheet</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label={isReadOnly ? "Download Sheet" : "Upload Expense Sheet"}
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    {isReadOnly && field.value && (
                                        <a href={field.value} target="_blank" className="text-sm text-blue-600 underline">View File</a>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tripExpenseSheet"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trip Expense Sheet (Required) ⚠️</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label={isReadOnly ? "Download Trip Expense Sheet" : "Upload Trip Expense Sheet"}
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-red-600">
                                        Required to move to Stage 4
                                    </FormDescription>
                                    {isReadOnly && field.value && (
                                        <a href={field.value} target="_blank" className="text-sm text-blue-600 underline">View File</a>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="actualParticipantCount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Actual Participant Count</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Number of actual attendees" {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormDescription>Actual number of participants who attended</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="medicalIssues"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Medical Issues Reported</FormLabel>
                                        <FormDescription className="text-xs">Check if any medical issues occurred</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {form.watch('medicalIssues') && (
                            <FormField
                                control={form.control}
                                name="medicalIssuesDetails"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Medical Issues Details</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe the medical issues..." className="h-24" {...field} disabled={isReadOnly} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="facilitatorRemarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Facilitator Remarks</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Post-delivery feedback from facilitators..." className="h-24" {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormDescription>Feedback and observations from the delivery team</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="activitiesExecuted"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Activities Executed</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="List activities that were executed..." className="h-24" {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormDescription>Which committed activities were actually delivered</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bdLeadGenDone"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>BD Lead Generation Complete</FormLabel>
                                        <FormDescription className="text-xs">Business development follow-up completed</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="packingCheckDone"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Packing Checklist Complete ✓</FormLabel>
                                        <FormDescription className="text-xs">
                                            Required to move to Stage 4
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="submit" variant="outline" disabled={isLoading || isTransitioning}>
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Progress
                        </Button>

                        <Button type="button" onClick={onCompleteStage} disabled={isLoading || isTransitioning || !form.getValues('programCompleted') || !form.getValues('initialExpenseSheet')}>
                            {isTransitioning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                            Complete Stage 3
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
