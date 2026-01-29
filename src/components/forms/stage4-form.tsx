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
import { showToast } from "@/components/ui/toaster"
import { FileUpload } from "@/components/ui/file-upload"

const stage4Schema = z.object({
    npsScore: z.coerce.number().min(0).max(10).optional(),
    clientFeedback: z.string().optional(),
    finalInvoiceSubmitted: z.boolean().default(false),
    vendorPaymentsClear: z.boolean().default(false),
    googleReviewLink: z.union([
        z.string().url({ message: "Must be a valid URL (e.g., https://g.page/...)" }),
        z.literal('')
    ]).optional(),
    videoTestimonialFile: z.string().optional(),
    opsDataManagerLink: z.union([
        z.string().url({ message: "Must be a valid URL (e.g., https://...)" }),
        z.literal('')
    ]).optional(),
    zfdRating: z.coerce.number().min(1).max(5).optional(),
    zfdComments: z.string().optional(),
    expensesBillsSubmitted: z.boolean().default(false),
    opsDataManagerUpdated: z.boolean().default(false),
})

export function Stage4Form({ program, isReadOnly = false }: { program: any, isReadOnly?: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage4Schema>>({
        resolver: zodResolver(stage4Schema) as any,
        defaultValues: {
            npsScore: program.npsScore ?? undefined,
            clientFeedback: program.clientFeedback || "",
            finalInvoiceSubmitted: program.finalInvoiceSubmitted || false,
            vendorPaymentsClear: program.vendorPaymentsClear || false,
            googleReviewLink: program.googleReviewLink || "",
            videoTestimonialFile: program.videoTestimonialFile || "",
            opsDataManagerLink: program.opsDataManagerLink || "",
            zfdRating: program.zfdRating ?? undefined,
            zfdComments: program.zfdComments || "",
            expensesBillsSubmitted: program.expensesBillsSubmitted || false,
            opsDataManagerUpdated: program.opsDataManagerUpdated || false,
        },
    })

    async function onSave(values: z.infer<typeof stage4Schema>) {
        setIsLoading(true)
        try {
            const result = await updateStage4(program.id, values)

            if (result.error) {
                showToast(`Error: ${result.error}`, "error")
            } else {
                showToast("Saved successfully", "success")
                router.refresh()
            }
        } catch (error: any) {
            const errorMsg = error?.message || error?.toString() || "Failed to save"
            showToast(`Error: ${errorMsg}`, "error")
            console.error("Save error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function onCloseProgram() {
        setIsTransitioning(true)
        const result = await moveToStage5(program.id)

        console.log('🔄 Stage 4→5 transition result:', result)

        if (result.error) {
            const errorMsg = (result as any).details
                ? `${result.error}\n\n${(result as any).details.join('\n')}`
                : result.error
            console.error("Stage 4→5 closure error:", result)
            showToast(errorMsg, "error")
        } else {
            showToast("Program closed successfully", "success")
            console.log('✅ Program successfully closed and locked!')
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

                        <FormField
                            control={form.control}
                            name="googleReviewLink"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Google Review Link (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://g.page/..." {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormDescription>Link to Google review if received</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="videoTestimonialFile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Video Testimonial (Optional)</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label="Upload Video Testimonial"
                                            acceptedFileTypes={['mp4', 'mov', 'avi', 'wmv', 'webm']}
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Video files only (MP4, MOV, AVI, WMV, WebM)
                                    </FormDescription>
                                    {field.value && (
                                        <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline block mt-2">View Video</a>
                                    )}
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
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Vendor Payments Cleared</FormLabel>
                                        <FormDescription>All vendor dues settled.</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="expensesBillsSubmitted"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-red-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Expenses & Bills Submitted ⚠️</FormLabel>
                                        <FormDescription className="text-red-600 font-medium">
                                            REQUIRED to close program
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="opsDataManagerUpdated"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-red-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Ops Data Manager Updated ⚠️</FormLabel>
                                        <FormDescription className="text-red-600 font-medium">
                                            REQUIRED to close program
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="opsDataManagerLink"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ops Data Manager Link (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} disabled={isReadOnly} />
                                    </FormControl>
                                    <FormDescription>Link to the updated ops data manager entry</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* ZFD Rating Section */}
                <div className="border-t pt-6 space-y-4">
                    <h4 className="font-semibold text-lg text-purple-800">Zero Defect (ZFD) Rating</h4>

                    <FormField
                        control={form.control}
                        name="zfdRating"
                        render={({ field }) => (
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
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="zfdComments"
                        render={({ field }) => (
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
                                <FormDescription>
                                    Mandatory if rating is 3 or below
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                            onClick={onCloseProgram}
                            disabled={
                                isLoading ||
                                isTransitioning ||
                                !form.getValues('zfdRating') ||
                                !form.getValues('expensesBillsSubmitted') ||
                                !form.getValues('opsDataManagerUpdated')
                            }
                        >
                            {isTransitioning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
                            Close Program & Archive
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
