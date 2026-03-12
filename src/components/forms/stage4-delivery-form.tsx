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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, ArrowRight, Truck } from "lucide-react"
import { showToast } from "@/components/ui/toaster"

const stage4Schema = z.object({
    specialInstructions: z.string().optional(),
    packingFinalCheckBy: z.string().optional(),
    packingProcurementDelays: z.boolean().default(false),
    onTimeSetup: z.boolean().optional(),
    setupDelayDetails: z.string().optional(),
    onGroundLeadGen: z.boolean().default(false),
    onGroundBD: z.boolean().default(false),
    teamActivitiesExecuted: z.string().optional(),
    participantCount: z.string().optional(),
    outingComments: z.string().optional(),
    medicalIssuesComments: z.string().optional(),
    photosVideosUploaded: z.boolean().default(false),
    tripExpenseSubmitted: z.boolean().default(false),
    deliveryGeneralComment: z.string().optional(),
})

interface Stage4DeliveryFormProps {
    program: any
    isReadOnly?: boolean
    onSuccess?: () => void
    onSaveOnly?: () => void
    isTransitioningToThisStage?: boolean
}

export function Stage4DeliveryForm({
    program,
    isReadOnly = false,
    onSuccess,
    onSaveOnly,
    isTransitioningToThisStage = false
}: Stage4DeliveryFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage4Schema>>({
        resolver: zodResolver(stage4Schema) as any,
        defaultValues: {
            specialInstructions: program.specialInstructions || "",
            packingFinalCheckBy: program.packingFinalCheckBy || "",
            packingProcurementDelays: program.packingProcurementDelays || false,
            onTimeSetup: program.onTimeSetup ?? undefined,
            setupDelayDetails: program.setupDelayDetails || "",
            onGroundLeadGen: program.onGroundLeadGen || false,
            onGroundBD: program.onGroundBD || false,
            teamActivitiesExecuted: program.teamActivitiesExecuted || "",
            participantCount: program.participantCount || "",
            outingComments: program.outingComments || "",
            medicalIssuesComments: program.medicalIssuesComments || "",
            photosVideosUploaded: program.photosVideosUploaded || false,
            tripExpenseSubmitted: program.tripExpenseSubmitted || false,
            deliveryGeneralComment: program.deliveryGeneralComment || "",
        },
    })

    async function onSave(values: z.infer<typeof stage4Schema>) {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/stage4`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })
            const result = await res.json()
            if (result.error) showToast(`Error: ${result.error}`, "error")
            else {
                showToast("Saved successfully", "success")
                if (onSaveOnly) onSaveOnly()
                else router.refresh()
            }
        } catch (error: any) {
            showToast(`Error: ${error?.message || "Failed to save"}`, "error")
        } finally {
            setIsLoading(false)
        }
    }

    async function onMoveToPostTrip() {
        setIsTransitioning(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/stage4/move`, { method: 'POST' })
            const result = await res.json()
            if (result.error) {
                const msg = result.details ? `${result.error}\n\n${result.details.join('\n')}` : result.error
                showToast(msg, "error")
            } else {
                showToast("Moved to Post Trip Closure", "success")
                if (onSuccess) onSuccess()
                else router.refresh()
            }
        } catch (error: any) {
            showToast(`Error: ${error?.message || "Failed"}`, "error")
        } finally {
            setIsTransitioning(false)
        }
    }

    const showDelayReason = form.watch('onTimeSetup') === false

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 border p-6 rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Delivery
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wider">Pre-Delivery</h4>

                        <FormField control={form.control} name="specialInstructions" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Special Instructions</FormLabel>
                                <FormControl><Textarea placeholder="Any special notes for the delivery team..." className="h-20" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="packingFinalCheckBy" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Packing Final Check & Loading Done By</FormLabel>
                                <FormControl><Textarea placeholder="Who did the final packing check..." className="h-16" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="packingProcurementDelays" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} /></FormControl>
                                <div className="leading-none"><FormLabel>Delays with Packing or Procurement?</FormLabel></div>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="onTimeSetup" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                <FormControl><Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} disabled={isReadOnly} /></FormControl>
                                <div className="leading-none">
                                    <FormLabel>On Time for Activity Set-up?</FormLabel>
                                    <FormDescription className="text-xs">Uncheck if there were delays</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        {showDelayReason && (
                            <FormField control={form.control} name="setupDelayDetails" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason for Delay</FormLabel>
                                    <FormControl><Textarea placeholder="Describe the delay reason..." className="h-16" {...field} disabled={isReadOnly} /></FormControl>
                                </FormItem>
                            )} />
                        )}

                        <FormField control={form.control} name="onGroundLeadGen" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} /></FormControl>
                                <div className="leading-none"><FormLabel>On Ground Lead Generation?</FormLabel></div>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="onGroundBD" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} /></FormControl>
                                <div className="leading-none"><FormLabel>On Ground BD?</FormLabel></div>
                            </FormItem>
                        )} />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wider">Execution & Post-Activity</h4>

                        <FormField control={form.control} name="teamActivitiesExecuted" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Team Activities Executed</FormLabel>
                                <FormControl><Textarea placeholder="List of activities executed..." className="h-20" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="participantCount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>No. of Participants</FormLabel>
                                <FormControl><Input placeholder="e.g., 45" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="outingComments" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Outing Comments - Remarks from Facilitator</FormLabel>
                                <FormControl><Textarea placeholder="Facilitator's observations and remarks..." className="h-20" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="medicalIssuesComments" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Medical Issues?</FormLabel>
                                <FormControl><Textarea placeholder="Any medical issues that occurred..." className="h-16" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="photosVideosUploaded" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-blue-50">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} /></FormControl>
                                <div className="leading-none">
                                    <FormLabel>Program Photos/Videos Upload</FormLabel>
                                    <FormDescription className="text-xs">Drive link if possible</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="tripExpenseSubmitted" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-red-50">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} /></FormControl>
                                <div className="leading-none">
                                    <FormLabel>Trip Expense Sheet Submission ⚠️</FormLabel>
                                    <FormDescription className="text-xs text-red-600">Required to move to Post Trip Closure</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="deliveryGeneralComment" render={({ field }) => (
                            <FormItem>
                                <FormLabel>General Comment</FormLabel>
                                <FormControl><Textarea placeholder="Any other notes..." className="h-20" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />
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
                            onClick={onMoveToPostTrip}
                            disabled={isLoading || isTransitioning || !form.getValues('tripExpenseSubmitted') || !form.getValues('participantCount') || !form.getValues('teamActivitiesExecuted')}
                        >
                            {isTransitioning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                            Move to Post Trip Closure
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
