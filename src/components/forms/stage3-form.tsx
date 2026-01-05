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
import { FileUpload } from "@/components/ui/file-upload"

const stage3Schema = z.object({
    venueReached: z.boolean().default(false),
    facilitatorsReached: z.boolean().default(false),
    programCompleted: z.boolean().default(false),
    deliveryNotes: z.string().optional(),
    initialExpenseSheet: z.string().optional(),
})

export function Stage3Form({ program, isReadOnly = false }: { program: any, isReadOnly?: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage3Schema>>({
        resolver: zodResolver(stage3Schema),
        defaultValues: {
            venueReached: program.venueReached || false,
            facilitatorsReached: program.facilitatorsReached || false,
            programCompleted: program.programCompleted || false,
            deliveryNotes: program.deliveryNotes || "",
            initialExpenseSheet: program.initialExpenseSheet || "",
        },
    })

    async function onSave(values: z.infer<typeof stage3Schema>) {
        setIsLoading(true)
        try {
            await updateStage3(program.id, values)
            alert("Saved successfully")
            router.refresh()
        } catch (error) {
            alert("Failed to save")
        } finally {
            setIsLoading(false)
        }
    }

    async function onCompleteStage() {
        if (!confirm("Confirm program completion and move to Stage 4?")) return

        setIsTransitioning(true)
        const result = await moveToStage4(program.id)
        if (result.error) {
            alert(result.error)
        } else {
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
                                    <FormLabel>Initial Expense Sheet (Required)</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label={isReadOnly ? "Download Sheet" : "Upload Expense Sheet"}
                                        />
                                    </FormControl>
                                    {isReadOnly && field.value && (
                                        <a href={field.value} target="_blank" className="text-sm text-blue-600 underline">View File</a>
                                    )}
                                    <FormMessage />
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
