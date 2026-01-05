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
import { updateStage4, moveToStage5 } from "@/app/actions/stage4"
import { useRouter } from "next/navigation"
import { Loader2, Save, Archive, ThumbsUp } from "lucide-react"

const stage4Schema = z.object({
    npsScore: z.coerce.number().min(0).max(10).optional(),
    clientFeedback: z.string().optional(),
    finalInvoiceSubmitted: z.boolean().default(false),
    vendorPaymentsClear: z.boolean().default(false),
})

export function Stage4Form({ program, isReadOnly = false }: { program: any, isReadOnly?: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage4Schema>>({
        resolver: zodResolver(stage4Schema),
        defaultValues: {
            npsScore: program.npsScore || undefined,
            clientFeedback: program.clientFeedback || "",
            finalInvoiceSubmitted: program.finalInvoiceSubmitted || false,
            vendorPaymentsClear: program.vendorPaymentsClear || false,
        },
    })

    async function onSave(values: z.infer<typeof stage4Schema>) {
        setIsLoading(true)
        try {
            await updateStage4(program.id, values)
            alert("Saved successfully")
            router.refresh()
        } catch (error) {
            alert("Failed to save")
        } finally {
            setIsLoading(false)
        }
    }

    async function onCloseProgram() {
        if (!confirm("Are you sure you want to CLOSE this program? This action is final.")) return

        setIsTransitioning(true)
        const result = await moveToStage5(program.id)
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
                    <h3 className="text-xl font-semibold text-purple-800 flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5" />
                        Stage 4: Feedback & Closure
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Feedback */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Client Feedback</h4>
                        <FormField
                            control={form.control}
                            name="npsScore"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>NPS Score (0-10)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" max="10" {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="clientFeedback"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Qualitative Feedback</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="What did the client say?" className="h-32" {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Finance Closure */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Financial Closure</h4>

                        <FormField
                            control={form.control}
                            name="finalInvoiceSubmitted"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Final Invoice Submitted</FormLabel>
                                        <FormDescription>Confirm invoice sent to client.</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="vendorPaymentsClear"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Vendor Payments Cleared</FormLabel>
                                        <FormDescription>Optional check for ops tracking.</FormDescription>
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

                        <Button type="button" variant="destructive" onClick={onCloseProgram} disabled={isLoading || isTransitioning || !form.getValues('finalInvoiceSubmitted') || !form.getValues('npsScore')}>
                            {isTransitioning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
                            Data Closed & Archive
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
