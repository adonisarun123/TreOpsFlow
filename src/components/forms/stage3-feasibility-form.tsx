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
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, ArrowRight, ClipboardCheck, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { showToast } from "@/components/ui/toaster"
import { FileUpload } from "@/components/ui/file-upload"

const stage3Schema = z.object({
    // Checklists
    confirmActivityAvailability: z.boolean().default(false),
    agendaWalkthroughDone: z.boolean().default(false),
    confirmFacilitatorsAvailability: z.boolean().default(false),
    facilitatorsFreelancersDetails: z.string().optional(),
    planDeliverablesValueAdds: z.boolean().default(false),
    transportationBlocking: z.boolean().default(false),
    teamTransportDetails: z.string().optional(),
    clientTransportDetails: z.string().optional(),
    helperBlocking: z.boolean().default(false),
    helperDetails: z.string().optional(),
    welcomeEmailChecklist: z.boolean().default(false),
    opsCashRequest: z.boolean().default(false),
    activityAreaConferenceHall: z.boolean().default(false),
    logisticsChecklist: z.boolean().default(false),
    logisticsListDocument: z.string().optional(),
    procurementChecklist: z.boolean().default(false),
    finalPacking: z.boolean().default(false),
    travelPlanComments: z.string().optional(),
    // Prints
    printHandoverSheet: z.boolean().default(false),
    printScoreSheet: z.boolean().default(false),
    printLogisticsSheet: z.boolean().default(false),
    printBlueprints: z.boolean().default(false),
    // Other
    nearestHospitalDetails: z.string().optional(),
    feasibilityComments: z.string().optional(),
})

interface Stage3FeasibilityFormProps {
    program: any
    isReadOnly?: boolean
    onSuccess?: () => void
    onSaveOnly?: () => void
    isTransitioningToThisStage?: boolean
}

export function Stage3FeasibilityForm({
    program,
    isReadOnly = false,
    onSuccess,
    onSaveOnly,
    isTransitioningToThisStage = false
}: Stage3FeasibilityFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage3Schema>>({
        resolver: zodResolver(stage3Schema) as any,
        defaultValues: {
            confirmActivityAvailability: program.confirmActivityAvailability || false,
            agendaWalkthroughDone: program.agendaWalkthroughDone || false,
            confirmFacilitatorsAvailability: program.confirmFacilitatorsAvailability || false,
            facilitatorsFreelancersDetails: program.facilitatorsFreelancersDetails || "",
            planDeliverablesValueAdds: program.planDeliverablesValueAdds || false,
            transportationBlocking: program.transportationBlocking || false,
            teamTransportDetails: program.teamTransportDetails || "",
            clientTransportDetails: program.clientTransportDetails || "",
            helperBlocking: program.helperBlocking || false,
            helperDetails: program.helperDetails || "",
            welcomeEmailChecklist: program.welcomeEmailChecklist || false,
            opsCashRequest: program.opsCashRequest || false,
            activityAreaConferenceHall: program.activityAreaConferenceHall || false,
            logisticsChecklist: program.logisticsChecklist || false,
            logisticsListDocument: program.logisticsListDocument || "",
            procurementChecklist: program.procurementChecklist || false,
            finalPacking: program.finalPacking || false,
            travelPlanComments: program.travelPlanComments || program.agendaDocumentStage3 || "",
            printHandoverSheet: program.printHandoverSheet || false,
            printScoreSheet: program.printScoreSheet || false,
            printLogisticsSheet: program.printLogisticsSheet || false,
            printBlueprints: program.printBlueprints || false,
            nearestHospitalDetails: program.nearestHospitalDetails || "",
            feasibilityComments: program.feasibilityComments || "",
        },
    })

    async function onSave(values: z.infer<typeof stage3Schema>) {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/stage3`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })
            const result = await res.json()
            if (result.error) {
                showToast(`Error: ${result.error}`, "error")
            } else {
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

    async function onMoveToDelivery() {
        setIsTransitioning(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/stage3/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form.getValues()),
            })
            const result = await res.json()
            if (result.error) {
                const msg = result.details ? `${result.error}\n\n${result.details.join('\n')}` : result.error
                showToast(msg, "error")
            } else {
                showToast("Moved to Delivery", "success")
                if (onSuccess) onSuccess()
                else router.refresh()
            }
        } catch (error: any) {
            showToast(`Error: ${error?.message || "Failed"}`, "error")
        } finally {
            setIsTransitioning(false)
        }
    }

    const ChecklistItem = ({ name, label }: { name: any, label: string }) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-border p-4 bg-muted/20">
                    <FormControl>
                        <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} disabled={isReadOnly} />
                    </FormControl>
                    <div className="leading-none flex items-center gap-1.5 flex-1 cursor-pointer" onClick={() => !isReadOnly && field.onChange(!field.value)}>
                        <FormLabel className="cursor-pointer text-sm font-medium leading-none">{label}</FormLabel>
                    </div>
                </FormItem>
            )}
        />
    )

    return (
        <TooltipProvider delayDuration={300}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 border border-border p-6 rounded-xl bg-card shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5" />
                            Feasibility Check & Preps
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Checklists */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-foreground text-sm uppercase tracking-wider mb-2">Pre-Delivery Checklist</h4>
                            <ChecklistItem name="confirmActivityAvailability" label="Confirm Activity Availability" />
                            <ChecklistItem name="agendaWalkthroughDone" label="Discuss Agenda" />
                            <ChecklistItem name="confirmFacilitatorsAvailability" label="Confirm Facilitators Availability & Blocking" />

                        <FormField control={form.control} name="facilitatorsFreelancersDetails" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Facilitators / Freelancers Details</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Names, contact details, specializations..." className="h-20" {...field} disabled={isReadOnly} />
                                </FormControl>
                            </FormItem>
                        )} />

                            <ChecklistItem name="planDeliverablesValueAdds" label="Plan Deliverables & Value Adds" />
                            <ChecklistItem name="transportationBlocking" label="Transportation Blocking" />

                        <FormField control={form.control} name="teamTransportDetails" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Team Transport Details</FormLabel>
                                <FormControl><Textarea placeholder="Bus details, driver contacts, pickup points..." className="h-16" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="clientTransportDetails" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Client Transport Details</FormLabel>
                                <FormControl><Textarea placeholder="Client travel arrangements, pickup points..." className="h-16" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />

                        <ChecklistItem name="helperBlocking" label="Helper Blocking" />
                        <FormField control={form.control} name="helperDetails" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Helper Details</FormLabel>
                                <FormControl><Textarea placeholder="Helper names, contacts, roles..." className="h-16" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />
                        </div>

                        {/* Right Column: More Checklists + Docs */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-foreground text-sm uppercase tracking-wider mb-2">Logistics & Documentation</h4>
                            <ChecklistItem name="welcomeEmailChecklist" label="Welcome Email to Client" />
                            <ChecklistItem name="opsCashRequest" label="Ops Cash Request" />
                            <ChecklistItem name="activityAreaConferenceHall" label="Activity Area / Conference Hall" />
                            <ChecklistItem name="logisticsChecklist" label="Logistics List" />

                        <FormField control={form.control} name="logisticsListDocument" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Logistics List (Doc Upload)</FormLabel>
                                <FormControl>
                                    <FileUpload onUploadComplete={field.onChange} currentFile={field.value} label="Upload Logistics List" disabled={isReadOnly} />
                                </FormControl>
                                {field.value && <a href={field.value} target="_blank" className="text-xs text-blue-600 underline">View File</a>}
                            </FormItem>
                        )} />

                            <ChecklistItem name="procurementChecklist" label="Procurement (if any)" />
                            <ChecklistItem name="finalPacking" label="Final Packing" />

                            <FormField control={form.control} name="travelPlanComments" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Travel Plan
                                        <Tooltip>
                                            <TooltipTrigger type="button"><Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>Document the travel plan here (routes, timings, stops, arrangements). This replaces the need to upload an agenda document.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Travel plan details — routes, timings, stops, arrangements..." className="h-24" {...field} disabled={isReadOnly} />
                                    </FormControl>
                                </FormItem>
                            )} />

                            <h4 className="font-medium text-foreground text-sm uppercase tracking-wider pt-6 mb-2">Prints</h4>
                            <ChecklistItem name="printHandoverSheet" label="Handover Sheet" />
                        <ChecklistItem name="printScoreSheet" label="Score Sheet" />
                        <ChecklistItem name="printLogisticsSheet" label="Logistics Sheet" />
                        <ChecklistItem name="printBlueprints" label="Blueprints" />

                            <h4 className="font-medium text-foreground text-sm uppercase tracking-wider pt-6 mb-2">Safety</h4>
                            <FormField control={form.control} name="nearestHospitalDetails" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Nearest Hospital (with phone number)</FormLabel>
                                <FormControl><Textarea placeholder="Hospital name, address, phone number..." className="h-16" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />

                            <FormField control={form.control} name="feasibilityComments" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">Comment Section</FormLabel>
                                    <FormControl><Textarea placeholder="Travel plan, ongoing preps, notes..." className="h-24" {...field} disabled={isReadOnly} /></FormControl>
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
                            onClick={onMoveToDelivery}
                            disabled={
                                isLoading || isTransitioning ||
                                !form.getValues('confirmActivityAvailability') ||
                                !form.getValues('confirmFacilitatorsAvailability') ||
                                !form.getValues('transportationBlocking') ||
                                !form.getValues('logisticsChecklist') ||
                                !form.getValues('finalPacking')
                            }
                        >
                            {isTransitioning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                            Move to Delivery
                        </Button>
                    </div>
                )}
                </form>
            </Form>
        </TooltipProvider>
    )
}
