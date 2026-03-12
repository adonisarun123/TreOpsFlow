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
import { useRouter } from "next/navigation"
import { Loader2, Save, Archive, CheckCircle } from "lucide-react"
import { showToast } from "@/components/ui/toaster"

const stage5Schema = z.object({
    googleReviewDone: z.boolean().default(false),
    videoReviewDone: z.boolean().default(false),
    sharePicsToClient: z.boolean().default(false),
    opsDataEntryDone: z.boolean().default(false),
    tripExpensesBillsSubmittedToFinance: z.boolean().default(false),
    opsExpenseStatementSubmittedToSales: z.boolean().default(false),
    logisticsUnpackingDone: z.boolean().default(false),
    logisticsUnpackingComment: z.string().optional(),
    zfdRating: z.coerce.number().min(1).max(5).optional(),
    zfdComments: z.string().optional(),
})

interface Stage5PostTripFormProps {
    program: any
    isReadOnly?: boolean
    onSuccess?: () => void
    onSaveOnly?: () => void
    isTransitioningToThisStage?: boolean
}

export function Stage5PostTripForm({
    program,
    isReadOnly = false,
    onSuccess,
    onSaveOnly,
    isTransitioningToThisStage = false
}: Stage5PostTripFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage5Schema>>({
        resolver: zodResolver(stage5Schema) as any,
        defaultValues: {
            googleReviewDone: program.googleReviewDone || false,
            videoReviewDone: program.videoReviewDone || false,
            sharePicsToClient: program.sharePicsToClient || false,
            opsDataEntryDone: program.opsDataEntryDone || false,
            tripExpensesBillsSubmittedToFinance: program.tripExpensesBillsSubmittedToFinance || false,
            opsExpenseStatementSubmittedToSales: program.opsExpenseStatementSubmittedToSales || false,
            logisticsUnpackingDone: program.logisticsUnpackingDone || false,
            logisticsUnpackingComment: program.logisticsUnpackingComment || "",
            zfdRating: program.zfdRating ?? '',
            zfdComments: program.zfdComments || "",
        },
    })

    async function onSave(values: z.infer<typeof stage5Schema>) {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/stage5`, {
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

    async function onMoveToDone() {
        setIsTransitioning(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/stage5/move`, { method: 'POST' })
            const result = await res.json()
            if (result.error) {
                const msg = result.details ? `${result.error}\n\n${result.details.join('\n')}` : result.error
                showToast(msg, "error")
            } else {
                showToast("Program marked as Done", "success")
                if (onSuccess) onSuccess()
                else router.refresh()
            }
        } catch (error: any) {
            showToast(`Error: ${error?.message || "Failed"}`, "error")
        } finally {
            setIsTransitioning(false)
        }
    }

    const YesNoItem = ({ name, label }: { name: any, label: string }) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                        <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} disabled={isReadOnly} />
                    </FormControl>
                    <div className="leading-none">
                        <FormLabel className="text-sm">{label}</FormLabel>
                    </div>
                </FormItem>
            )}
        />
    )

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 border p-6 rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-purple-800 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Post Trip Closure
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Checklists */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wider">Post-Trip Checklist</h4>
                        <YesNoItem name="googleReviewDone" label="Google Reviews" />
                        <YesNoItem name="videoReviewDone" label="Video Review" />
                        <YesNoItem name="sharePicsToClient" label="Share Pics to Client" />
                        <YesNoItem name="opsDataEntryDone" label="Ops Data Entry (drive link)" />

                        <FormField control={form.control} name="tripExpensesBillsSubmittedToFinance" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-red-50">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} /></FormControl>
                                <div className="leading-none">
                                    <FormLabel className="text-sm">Trip Expenses/Bills — Submit to Finance ⚠️</FormLabel>
                                    <FormDescription className="text-xs text-red-600">Required to close</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <YesNoItem name="opsExpenseStatementSubmittedToSales" label="Ops Expense Statement + Outing Comments — Submit to Sales POC" />

                        <FormField control={form.control} name="logisticsUnpackingDone" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} /></FormControl>
                                <div className="leading-none"><FormLabel className="text-sm">Logistics Unpacking</FormLabel></div>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="logisticsUnpackingComment" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Logistics Unpacking Comment</FormLabel>
                                <FormControl><Textarea placeholder="Notes on unpacking, damage, missing items..." className="h-16" {...field} disabled={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    {/* Right Column: ZFD */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wider">Zero Defect (ZFD) Rating</h4>

                        <FormField control={form.control} name="zfdRating" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base font-semibold">ZFD Rating (1-5) ⚠️</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="5"
                                        placeholder="Enter rating 1-5"
                                        {...field}
                                        disabled={isReadOnly}
                                        className="text-lg"
                                    />
                                </FormControl>
                                <FormDescription className="text-red-600 font-medium">
                                    REQUIRED to close program (1=Poor, 5=Excellent)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="zfdComments" render={({ field }) => (
                            <FormItem>
                                <FormLabel>ZFD Comments</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Required if rating ≤ 3 (minimum 10 characters)..."
                                        className="h-24"
                                        {...field}
                                        disabled={isReadOnly}
                                    />
                                </FormControl>
                                <FormDescription>Mandatory if rating is 3 or below</FormDescription>
                                <FormMessage />
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
                            variant="destructive"
                            onClick={onMoveToDone}
                            disabled={
                                isLoading || isTransitioning ||
                                !form.getValues('zfdRating') ||
                                !form.getValues('tripExpensesBillsSubmittedToFinance') ||
                                !form.getValues('opsDataEntryDone')
                            }
                        >
                            {isTransitioning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
                            Close Program & Move to Done
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
