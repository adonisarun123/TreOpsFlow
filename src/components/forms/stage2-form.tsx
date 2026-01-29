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
import { updateProgram, moveToStage3 } from "@/app/actions/stage2"
import { useRouter } from "next/navigation"
import { Loader2, Save, ArrowRight } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import { showToast } from "@/components/ui/toaster"

const stage2Schema = z.object({
    facilitatorsBlocked: z.string().optional(),
    helperStaffBlocked: z.string().optional(),
    transportBlocked: z.string().optional(),

    logisticsList: z.string().optional(),
    logisticsListLocked: z.boolean().default(false),
    logisticsListDocument: z.string().optional(),
    travelPlanDocument: z.string().optional(),
    agendaDocumentStage2: z.string().optional(),

    agendaWalkthroughDone: z.boolean().default(false),
    allResourcesBlocked: z.boolean().default(false),
    prepComplete: z.boolean().default(false),
})

export function Stage2Form({ program, isReadOnly = false }: { program: any, isReadOnly?: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    // Parse JSONs or use raw strings for now
    const form = useForm<z.infer<typeof stage2Schema>>({
        resolver: zodResolver(stage2Schema) as any,
        defaultValues: {
            facilitatorsBlocked: program.facilitatorsBlocked || "",
            helperStaffBlocked: program.helperStaffBlocked || "",
            transportBlocked: program.transportBlocked || "",
            logisticsList: program.logisticsList || "",
            logisticsListLocked: program.logisticsListLocked || false,
            logisticsListDocument: program.logisticsListDocument || "",
            travelPlanDocument: program.travelPlanDocument || "",
            agendaDocumentStage2: program.agendaDocumentStage2 || "",
            agendaWalkthroughDone: program.agendaWalkthroughDone || false,
            allResourcesBlocked: program.allResourcesBlocked || false,
            prepComplete: program.prepComplete || false,
        },
    })

    async function onSave(values: z.infer<typeof stage2Schema>) {
        setIsLoading(true)
        try {
            const result = await updateProgram(program.id, values)
            if (result.error) {
                showToast(`Error: ${result.error}`, "error")
            } else {
                showToast("Saved successfully", "success")
                router.refresh()
            }
        } catch (error: any) {
            // Catch network or unexpected errors
            const errorMsg = error?.message || error?.toString() || "Failed to save"
            showToast(`Error: ${errorMsg}`, "error")
            console.error("Save error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function onCompleteStage() {
        setIsTransitioning(true)
        const result = await moveToStage3(program.id)
        if (result.error) {
            // Show detailed error messages if available
            const errorMsg = (result as any).details
                ? `${result.error}\n\n${(result as any).details.join('\n')}`
                : result.error
            showToast(errorMsg, "error")
        } else {
            showToast("Moved to Stage 3 successfully", "success")
            router.refresh()
        }
        setIsTransitioning(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 border p-6 rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Stage 2: Feasibility & Preps</h3>
                    {/* If read-only, maybe show a badge? */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resource Blocking */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Resource Blocking</h4>
                        <FormField
                            control={form.control}
                            name="facilitatorsBlocked"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Facilitators (Names/IDs)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John, Jane" {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="helperStaffBlocked"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Support Staff</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Staff names..." {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="transportBlocked"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transport Details</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Bus details, driver contacts..." {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Logistics & Checklist */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Logistics & Prep</h4>
                        <FormField
                            control={form.control}
                            name="logisticsList"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Logistics List / Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="List of items..." className="h-32" {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="logisticsListDocument"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Logistics List Document (Optional)</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label="Upload Logistics List"
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    {field.value && (
                                        <div className="mt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a href={field.value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                    View/Download File
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="travelPlanDocument"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Travel Plan Document (Optional)</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label="Upload Travel Plan"
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    {field.value && (
                                        <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline block mt-2">View File</a>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="agendaDocumentStage2"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agenda Document - Stage 2 (Optional)</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label="Upload Stage 2 Agenda"
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    {field.value && (
                                        <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline block mt-2">View File</a>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="agendaWalkthroughDone"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Agenda Walkthrough Done</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="logisticsListLocked"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Logistics List Locked</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="allResourcesBlocked"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>All Resources Blocked ✓</FormLabel>
                                        <FormDescription className="text-xs">
                                            Required to progress to Stage 3
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="prepComplete"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Prep Complete</FormLabel>
                                        <FormDescription>Ready for delivery.</FormDescription>
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

                        <Button
                            type="button"
                            onClick={onCompleteStage}
                            disabled={
                                isLoading ||
                                isTransitioning ||
                                !form.getValues('prepComplete') ||
                                !form.getValues('logisticsListLocked') ||
                                !form.getValues('allResourcesBlocked')
                            }
                        >
                            {isTransitioning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                            Complete Stage 2
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
