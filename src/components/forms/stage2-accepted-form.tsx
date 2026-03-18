"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
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
import { Loader2, Save, ArrowRight, Users, X, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { showToast } from "@/components/ui/toaster"
import { RejectionModal } from "@/components/ui/rejection-modal"
import type { ProgramCard } from "@/types"

const stage2Schema = z.object({
    opsSPOCAssignedName: z.string().min(1, "Please select an Ops POC"),
    handoverChecklistCompleted: z.boolean().default(false),
    meetingWithSalesDone: z.boolean().default(false),
    opsComments: z.string().optional(),
})

interface Stage2AcceptedFormProps {
    program: ProgramCard
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
    isTransitioningToThisStage: _isTransitioningToThisStage = false
}: Stage2AcceptedFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage2Schema>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        } catch (error: unknown) {
            const errorMsg = (error as Error)?.message || "Failed to save"
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
                body: JSON.stringify(form.getValues()),
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
        } catch (error: unknown) {
            showToast(`Error: ${(error as Error)?.message || "Failed"}`, "error")
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
        } catch (error: unknown) {
            showToast(`Error: ${(error as Error)?.message || "Failed"}`, "error")
        }
    }

    const OPS_POCS = ["Sharath", "Nels", "MK", "Vijay"]

    return (
        <TooltipProvider delayDuration={300}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 sm:space-y-6 border border-border p-3 sm:p-6 rounded-xl bg-card shadow-sm">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-500 flex items-center gap-2">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                            Accepted Handover
                        </h3>
                    {!isReadOnly && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowRejectModal(true)}
                            className="h-7 sm:h-9 text-xs sm:text-sm"
                        >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            Reject
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Left Column: Assignment & Checklist */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Ops POC Assignment</h4>

                        <FormField
                            control={form.control}
                            name="opsSPOCAssignedName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Assign Ops POC <span className="text-destructive">*</span>
                                    </FormLabel>
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <h4 className="font-medium text-gray-700 pt-4">Handover Acceptance</h4>

                        <FormField
                            control={form.control}
                            name="handoverChecklistCompleted"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-border bg-muted/20 p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="leading-none flex items-center gap-1.5 flex-1 cursor-pointer" onClick={() => !isReadOnly && field.onChange(!field.value)}>
                                        <FormLabel className="cursor-pointer text-sm font-medium leading-none">
                                            Handover Acceptance Checklist ✓
                                        </FormLabel>
                                        <Tooltip>
                                            <TooltipTrigger type="button" tabIndex={-1} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                            </TooltipTrigger>
                                            <TooltipContent>All deliverables reviewed and accounted for</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="meetingWithSalesDone"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-border bg-muted/20 p-4 mt-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="leading-none flex items-center gap-1.5 flex-1 cursor-pointer" onClick={() => !isReadOnly && field.onChange(!field.value)}>
                                        <FormLabel className="cursor-pointer text-sm font-medium leading-none">
                                            Meeting with Sales POC ✓
                                        </FormLabel>
                                        <Tooltip>
                                            <TooltipTrigger type="button" tabIndex={-1} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                            </TooltipTrigger>
                                            <TooltipContent>Call done — deliverables understood</TooltipContent>
                                        </Tooltip>
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
                                    <FormLabel className="flex items-center gap-1.5">
                                        Comment Section
                                        <Tooltip>
                                            <TooltipTrigger type="button"><Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>Document any issues or discussion points from the handover review.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Issues, discussion points, clarifications needed, special requests..."
                                            className="h-40"
                                            {...field}
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4 border-t">
                        <Button type="submit" variant="outline" disabled={isLoading || isTransitioning} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                            {isLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> : <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />}
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
                            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                        >
                            {isTransitioning ? <Loader2 className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> : <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />}
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
        </TooltipProvider>
    )
}
