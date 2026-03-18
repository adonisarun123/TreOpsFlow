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
import { Loader2, Save, Archive, CheckCircle, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { showToast } from "@/components/ui/toaster"
import type { ProgramCard } from "@/types"

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
    program: ProgramCard
    isReadOnly?: boolean
    onSuccess?: () => void
    onSaveOnly?: () => void
    isTransitioningToThisStage?: boolean
    sheetUrls?: { opsDataEntrySheetUrl?: string; tripExpenseSheetUrl?: string }
}

export function Stage5PostTripForm({
    program,
    isReadOnly = false,
    onSuccess,
    onSaveOnly,
    isTransitioningToThisStage: _isTransitioningToThisStage = false,
    sheetUrls
}: Stage5PostTripFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage5Schema>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            zfdRating: program.zfdRating ?? undefined,
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
        } catch (error: unknown) {
            showToast(`Error: ${(error as Error)?.message || "Failed to save"}`, "error")
        } finally {
            setIsLoading(false)
        }
    }

    async function onMoveToDone() {
        setIsTransitioning(true)
        try {
            const res = await fetch(`/api/programs/${program.id}/stage5/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form.getValues()),
            })
            const result = await res.json()
            if (result.error) {
                const msg = result.details ? `${result.error}\n\n${result.details.join('\n')}` : result.error
                showToast(msg, "error")
            } else {
                showToast("Program marked as Done", "success")
                if (onSuccess) onSuccess()
                else router.refresh()
            }
        } catch (error: unknown) {
            showToast(`Error: ${(error as Error)?.message || "Failed"}`, "error")
        } finally {
            setIsTransitioning(false)
        }
    }

    const YesNoItem = ({ name, label }: { name: keyof z.infer<typeof stage5Schema>, label: string }) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4 bg-muted/20">
                    <FormControl>
                        <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} disabled={isReadOnly} />
                    </FormControl>
                    <div className="leading-none">
                        <FormLabel className="cursor-pointer">{label}</FormLabel>
                    </div>
                </FormItem>
            )}
        />
    )

    return (
        <TooltipProvider delayDuration={300}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 sm:space-y-6 border border-border p-3 sm:p-6 rounded-xl bg-card shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-500 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Post Trip Closure
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Checklists */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-foreground text-sm uppercase tracking-wider mb-2">Post-Trip Checklist</h4>
                        <YesNoItem name="googleReviewDone" label="Google Reviews" />
                        <YesNoItem name="videoReviewDone" label="Video Review" />
                        <YesNoItem name="sharePicsToClient" label="Share Pics to Client" />
                        <YesNoItem name="opsDataEntryDone" label="Ops Data Entry" />
                        {sheetUrls?.opsDataEntrySheetUrl ? (
                            <a href={sheetUrls.opsDataEntrySheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-6 -mt-2 block">📄 Open Ops Data Entry Sheet</a>
                        ) : (
                            <span className="text-xs text-muted-foreground ml-6 -mt-2 block">Ops Data Entry Sheet URL not configured — contact Admin</span>
                        )}

                            <FormField control={form.control} name="tripExpensesBillsSubmittedToFinance" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-border bg-muted/20 p-4">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} /></FormControl>
                                    <div className="leading-none flex items-center gap-1.5 flex-1 cursor-pointer" onClick={() => !isReadOnly && field.onChange(!field.value)}>
                                        <FormLabel className="flex items-center gap-1.5 cursor-pointer text-sm font-medium leading-none">
                                            Trip Expenses/Bills — Submit to Finance <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <Tooltip>
                                            <TooltipTrigger type="button" tabIndex={-1} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                            </TooltipTrigger>
                                            <TooltipContent>Required to close program</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </FormItem>
                            )} />
                        {sheetUrls?.tripExpenseSheetUrl ? (
                            <a href={sheetUrls.tripExpenseSheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-6 -mt-2 block">📄 Open Trip Expense Sheet</a>
                        ) : (
                            <span className="text-xs text-muted-foreground ml-6 -mt-2 block">Trip Expense Sheet URL not configured — contact Admin</span>
                        )}

                        <YesNoItem name="opsExpenseStatementSubmittedToSales" label="Ops Expense Statement + Outing Comments — Submit to Sales POC" />

                            <FormField control={form.control} name="logisticsUnpackingDone" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4 bg-muted/20">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} /></FormControl>
                                    <div className="leading-none cursor-pointer"><FormLabel>Logistics Unpacking</FormLabel></div>
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
                            <h4 className="font-medium text-foreground text-sm uppercase tracking-wider mb-2">Zero Defect (ZFD) Rating</h4>

                            <FormField control={form.control} name="zfdRating" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-semibold flex items-center gap-1.5">
                                        ZFD Rating (1-5) <span className="text-destructive">*</span>
                                    </FormLabel>
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
                                    <FormDescription className="text-muted-foreground">
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
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4 border-t">
                        <Button type="submit" variant="outline" disabled={isLoading || isTransitioning} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                            {isLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> : <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />}
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
                            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                        >
                            {isTransitioning ? <Loader2 className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> : <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />}
                            Close Program & Move to Done
                        </Button>
                    </div>
                )}
                </form>
            </Form>
        </TooltipProvider>
    )
}
