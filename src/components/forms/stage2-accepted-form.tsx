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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, ArrowRight, Users, X } from "lucide-react"
import { showToast } from "@/components/ui/toaster"
import { RejectionModal } from "@/components/ui/rejection-modal"

const stage2Schema = z.object({
    opsSPOCAssignedName: z.string().min(1, "Please select an Ops POC"),
    handoverChecklistCompleted: z.boolean().default(false),
    meetingWithSalesDone: z.boolean().default(false),
    opsComments: z.string().optional(),
})

interface Stage2AcceptedFormProps {
    program: any
    isReadOnly?: boolean
    onSuccess?: () => void
    onSaveOnly?: () => void
    isTransitioningToThisStage?: boolean
}

export function Stage2AcceptedForm({
    program,
    isReadOnly = false,
    onSuccess,
    onSaveOnly,
    isTransitioningToThisStage = false
}: Stage2AcceptedFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage2Schema>>({
        resolver: zodResolver(stage2Schema) as any,
        defaultValues: {
            opsSPOCAssignedName: program.opsSPOCAssignedName || "",
            handoverChecklistCompleted: program.handoverChecklistCompleted || false,
            meetingWithSalesDone: program.meetingWithSalesDone || false,
            opsComments: program.opsComments || "",
        },
    })

    async function onSave(values: z.infer<typeof stage2Schema>) {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/stage2`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })
            const result = await res.json()

            if (result.error) {
                showToast(`Error: ${result.error}`, "error")
            } else {
                showToast("Saved successfully", "success")
                if (onSaveOnly) {
                    onSaveOnly()
                } else {
                    router.refresh()
                }
            }
        } catch (error: any) {
            const errorMsg = error?.message || "Failed to save"
            showToast(`Error: ${errorMsg}`, "error")
        } finally {
            setIsLoading(false)
        }
    }

    async function onMoveToFeasibility() {
        setIsTransitioning(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/stage2/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            const result = await res.json()

            if (result.error) {
                const errorMsg = result.details
                    ? `${result.error}\n\n${result.details.join('\n')}`
                    : result.error
                showToast(errorMsg, "error")
            } else {
                showToast("Moved to Feasibility Check & Preps", "success")
                if (onSuccess) {
                    onSuccess()
                } else {
                    router.refresh()
                }
            }
        } catch (error: any) {
            showToast(`Error: ${error?.message || "Failed"}`, "error")
        } finally {
            setIsTransitioning(false)
        }
    }

    async function onRejectHandover(reason: string) {
        try {
            const { rejectOpsInStage2 } = await import("@/app/actions/rejection")
            const result = await rejectOpsInStage2(program.id, reason)
            if (result.error) {
                showToast(result.error, "error")
                throw new Error(result.error)
            } else {
                showToast("Handover rejected — returned to Sales", "success")
                router.refresh()
            }
        } catch (error: any) {
            showToast(`Error: ${error?.message || "Failed"}`, "error")
        }
    }

    const OPS_POCS = ["Sharath", "Nels", "MK", "Vijay"]

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 border p-6 rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Accepted Handover
                    </h3>
                    {!isReadOnly && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowRejectModal(true)}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Assignment & Checklist */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Ops POC Assignment</h4>

                        <FormField
                            control={form.control}
                            name="opsSPOCAssignedName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Ops POC *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isReadOnly}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Ops POC..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {OPS_POCS.map(poc => (
                                                <SelectItem key={poc} value={poc}>{poc}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs">
                                        Who will handle this program from the Ops side
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <h4 className="font-medium text-gray-700 pt-4">Handover Acceptance</h4>

                        <FormField
                            control={form.control}
                            name="handoverChecklistCompleted"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Handover Acceptance Checklist ✓</FormLabel>
                                        <FormDescription className="text-xs">
                                            All deliverables reviewed and accounted for
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="meetingWithSalesDone"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Meeting with Sales POC ✓</FormLabel>
                                        <FormDescription className="text-xs">
                                            Call done — deliverables understood
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Right Column: Comments */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Discussion & Issues</h4>

                        <FormField
                            control={form.control}
                            name="opsComments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comment Section</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Issues, discussion points, clarifications needed, special requests..."
                                            className="h-40"
                                            {...field}
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Document any issues or discussion points from the handover review
                                    </FormDescription>
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

                        <Button
                            type="button"
                            onClick={onMoveToFeasibility}
                            disabled={
                                isLoading ||
                                isTransitioning ||
                                !form.getValues('opsSPOCAssignedName') ||
                                !form.getValues('handoverChecklistCompleted') ||
                                !form.getValues('meetingWithSalesDone')
                            }
                        >
                            {isTransitioning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                            Move to Feasibility
                        </Button>
                    </div>
                )}
            </form>

            <RejectionModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onSubmit={onRejectHandover}
                title="Reject Handover (Stage 2)"
                description="Return this program to Sales for revision. Provide details about what needs to be fixed."
                placeholder="e.g., Missing client details, venue not feasible, dates conflict with existing programs..."
            />
        </Form>
    )
}
