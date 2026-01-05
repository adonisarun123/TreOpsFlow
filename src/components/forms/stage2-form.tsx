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

const stage2Schema = z.object({
    facilitatorsBlocked: z.string().optional(),
    helperStaffBlocked: z.string().optional(),
    transportBlocked: z.string().optional(),

    logisticsList: z.string().optional(),
    logisticsListLocked: z.boolean().default(false),

    agendaWalkthroughDone: z.boolean().default(false),
    prepComplete: z.boolean().default(false),
})

export function Stage2Form({ program, isReadOnly = false }: { program: any, isReadOnly?: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    // Parse JSONs or use raw strings for now
    const form = useForm<z.infer<typeof stage2Schema>>({
        resolver: zodResolver(stage2Schema),
        defaultValues: {
            facilitatorsBlocked: program.facilitatorsBlocked || "",
            helperStaffBlocked: program.helperStaffBlocked || "",
            transportBlocked: program.transportBlocked || "",
            logisticsList: program.logisticsList || "",
            logisticsListLocked: program.logisticsListLocked || false,
            agendaWalkthroughDone: program.agendaWalkthroughDone || false,
            prepComplete: program.prepComplete || false,
        },
    })

    async function onSave(values: z.infer<typeof stage2Schema>) {
        setIsLoading(true)
        try {
            await updateProgram(program.id, values)
            alert("Saved successfully")
            router.refresh()
        } catch (error) {
            alert("Failed to save")
        } finally {
            setIsLoading(false)
        }
    }

    async function onCompleteStage() {
        if (!confirm("Are you sure you want to move to Stage 3? This action cannot be undone.")) return

        setIsTransitioning(true)
        const result = await moveToStage3(program.id)
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
                                        <FormDescription>Confirm logistics are final.</FormDescription>
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

                        <Button type="button" onClick={onCompleteStage} disabled={isLoading || isTransitioning || !form.getValues('prepComplete')}>
                            {isTransitioning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                            Complete Stage 2
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
