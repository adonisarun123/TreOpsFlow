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
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect } from "react"
import { createProgram, updateStage1 } from "@/app/actions/stage1"
import { useRouter } from "next/navigation"
import { Loader2, Save, ArrowRight, CalendarIcon, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileUpload } from "@/components/ui/file-upload"
import { showToast } from "@/components/ui/toaster"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Dropdown options
const PROGRAM_TYPE_OPTIONS: ComboboxOption[] = [
    { value: "Team Building", label: "Team Building" },
    { value: "Leadership Development", label: "Leadership Development" },
    { value: "Training Workshop", label: "Training Workshop" },
    { value: "Corporate Outing", label: "Corporate Outing" },
    { value: "Other", label: "Other" },
]

const ACTIVITY_TYPE_OPTIONS: ComboboxOption[] = [
    { value: "Outdoor", label: "Outdoor" },
    { value: "Indoor", label: "Indoor" },
    { value: "Mixed", label: "Mixed" },
    { value: "Virtual", label: "Virtual" },
    { value: "Hybrid", label: "Hybrid" },
]

// Validation schema for Stage 1
const stage1Schema = z.object({
    // Basic Info
    programName: z.string().min(3, "Name must be at least 3 characters"),
    programType: z.string().min(1, "Program type required").refine(
        (val) => val !== "Other" || val.length > 5,
        { message: "Please specify your custom program type" }
    ),
    isMultiDayEvent: z.boolean().default(false),
    programDates: z.string().optional().refine((val) => {
        if (!val) return true // optional
        try {
            let dateToCheck: Date
            if (val.includes(' - ')) {
                dateToCheck = new Date(val.split(' - ')[0])
            } else {
                dateToCheck = new Date(val)
            }
            if (isNaN(dateToCheck.getTime())) return true // unparseable, let it pass
            const today = new Date(); today.setHours(0,0,0,0); dateToCheck.setHours(0,0,0,0)
            return dateToCheck >= today
        } catch { return true }
    }, { message: "Program date cannot be in the past" }),
    programTimings: z.string().optional(),
    location: z.string().min(1, "Location required"),
    minPax: z.coerce.number().min(1, "Minimum 1 participant"),
    maxPax: z.coerce.number().min(1, "Required"),
    trainingDays: z.coerce.number().optional(),

    // Client Details
    companyName: z.string().min(1, "Company name required"),
    companyAddress: z.string().optional(),
    clientPOCName: z.string().min(1, "POC name required"),
    clientPOCPhone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number (10 digits, starts with 6-9)"),
    clientPOCEmail: z.string().email("Invalid email address"),

    // Program Details
    previousEngagement: z.boolean().default(false),
    previousEngagementNotes: z.string().optional(),
    activityType: z.string().min(1, "Activity type required"),
    activitiesCommitted: z.string().optional(),
    objectives: z.string().min(10, "Objectives required (minimum 10 characters)"),
    deliveryBudget: z.coerce.number().min(1, "Budget must be greater than 0"),
    billingDetails: z.string().optional(),
    photoVideoCommitment: z.boolean().default(false),

    // Budget Categorization
    budgetVenue: z.coerce.number().optional(),
    budgetTransport: z.coerce.number().optional(),
    budgetActivities: z.coerce.number().optional(),
    budgetFood: z.coerce.number().optional(),
    budgetMiscellaneous: z.coerce.number().optional(),
    budgetNotes: z.string().optional(),

    // Logistics
    venuePOC: z.string().optional(),
    specialVenueReq: z.string().optional(),
    eventVendorDetails: z.string().optional(),

    // Files
    agendaDocument: z.string().optional(),
    objectiveDocuments: z.string().optional(),
}).refine(data => data.maxPax >= data.minPax, {
    message: "Max pax must be greater than or equal to min pax",
    path: ["maxPax"]
})

export function Stage1Form({ program, isEdit = false }: { program?: any, isEdit?: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const [singleDateOpen, setSingleDateOpen] = useState(false)
    const [rangeDateOpen, setRangeDateOpen] = useState(false)
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to?: Date | undefined } | undefined>(undefined)
    const router = useRouter()

    const form = useForm<z.infer<typeof stage1Schema>>({
        resolver: zodResolver(stage1Schema) as any,
        defaultValues: {
            programName: program?.programName || '',
            programType: program?.programType || '',
            isMultiDayEvent: program?.isMultiDayEvent || false,
            programDates: program?.programDates || '',
            programTimings: program?.programTimings || '',
            location: program?.location || '',
            minPax: program?.minPax ?? 1,
            maxPax: program?.maxPax ?? 50,
            trainingDays: program?.trainingDays ?? '',

            companyName: program?.companyName || '',
            companyAddress: program?.companyAddress || '',
            clientPOCName: program?.clientPOCName || '',
            clientPOCPhone: program?.clientPOCPhone || '',
            clientPOCEmail: program?.clientPOCEmail || '',

            previousEngagement: program?.previousEngagement || false,
            previousEngagementNotes: program?.previousEngagementNotes || '',
            activityType: program?.activityType || '',
            activitiesCommitted: program?.activitiesCommitted || '',
            objectives: program?.objectives || '',
            deliveryBudget: program?.deliveryBudget ?? '',
            billingDetails: program?.billingDetails || '',
            photoVideoCommitment: program?.photoVideoCommitment || false,

            budgetVenue: program?.budgetVenue ?? '',
            budgetTransport: program?.budgetTransport ?? '',
            budgetActivities: program?.budgetActivities ?? '',
            budgetFood: program?.budgetFood ?? '',
            budgetMiscellaneous: program?.budgetMiscellaneous ?? '',
            budgetNotes: program?.budgetNotes || '',

            venuePOC: program?.venuePOC || '',
            specialVenueReq: program?.specialVenueReq || '',
            eventVendorDetails: program?.eventVendorDetails || '',

            agendaDocument: program?.agendaDocument || "",
            objectiveDocuments: program?.objectiveDocuments || "",
        },
    })

    async function onSubmit(values: z.infer<typeof stage1Schema>) {
        setIsLoading(true)
        try {
            let result
            if (isEdit) {
                result = await updateStage1(program.id, values)
            } else {
                result = await createProgram(values)
            }

            if (result.error) {
                showToast(`Error: ${result.error}`, "error")
            } else {
                showToast(isEdit ? "Program updated successfully" : "Program created successfully", "success")
                if (!isEdit && 'programId' in result && result.programId) {
                    router.push(`/dashboard/programs/${result.programId}`)
                } else {
                    router.refresh()
                }
            }
        } catch (error: any) {
            const errorMsg = error?.message || error?.toString() || "Failed to save"
            showToast(`Error: ${errorMsg}`, "error")
            console.error("Submit error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const previousEngagement = form.watch("previousEngagement")
    const isMultiDay = form.watch("isMultiDayEvent")
    const programType = form.watch("programType")
    const programDates = form.watch("programDates")
    const programTimings = form.watch("programTimings")

    // Populate dateRange state when popup opens with existing value
    useEffect(() => {
        if (rangeDateOpen && programDates && programDates.includes(' - ')) {
            try {
                const [startStr, endStr] = programDates.split(' - ')
                const from = new Date(startStr)
                const to = new Date(endStr)
                if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                    setDateRange({ from, to })
                }
            } catch (e) {
                // Ignore parsing errors
            }
        } else if (!rangeDateOpen) {
            // Clear dateRange when popup closes (if not already cleared by save)
            setDateRange(undefined)
        }
    }, [rangeDateOpen, programDates])

    // Clear dates when toggling between single-day and multi-day modes
    useEffect(() => {
        if (isMultiDay && programDates && !programDates.includes(' - ')) {
            // User toggled to multi-day but has a single date selected
            // Clear it to force them to select a date range
            form.setValue('programDates', '')
            setDateRange(undefined)
        } else if (!isMultiDay && programDates && programDates.includes(' - ')) {
            // User toggled to single-day but has a date range selected
            // Clear it to force them to select a single date
            form.setValue('programDates', '')
            setDateRange(undefined)
        }
    }, [isMultiDay, programDates, form])

    // Validate time range
    const isTimeRangeValid = () => {
        if (!programTimings || !programTimings.includes(' - ')) return true
        const [start, end] = programTimings.split(' - ')
        if (!start || !end) return true
        return start < end // Compare time strings directly (works for HH:MM format)
    }

    return (
        <TooltipProvider delayDuration={300}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Section 1: Basic Program Information */}
                    <div className="border border-border p-6 rounded-xl bg-card shadow-sm">
                        <h3 className="text-lg font-semibold mb-5 text-primary">Basic Program Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="programName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Program Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Summer Leadership Camp" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="programType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Program Type <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select program type..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Team Building">Team Building</SelectItem>
                                            <SelectItem value="Leadership Development">Leadership Development</SelectItem>
                                            <SelectItem value="Training Workshop">Training Workshop</SelectItem>
                                            <SelectItem value="Corporate Outing">Corporate Outing</SelectItem>
                                            <SelectItem value="End to End">End to End</SelectItem>
                                            <SelectItem value="Events">Events</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {programType === "Other" && (
                            <FormField
                                control={form.control}
                                name="programType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Custom Program Type</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter custom program type..."
                                                {...field}
                                                value={field.value === "Other" ? "" : field.value}
                                                onChange={(e) => field.onChange(e.target.value || "Other")}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Specify your custom program type
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="isMultiDayEvent"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border bg-muted/30 p-4 mt-2">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="cursor-pointer">Multi-Day Event</FormLabel>
                                        <FormDescription>
                                            Check if this program spans multiple continuous dates

                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="programDates"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Program Date(s)</FormLabel>
                                    <FormControl>
                                        <div>
                                            {!isMultiDay ? (
                                                <Popover open={singleDateOpen} onOpenChange={setSingleDateOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? (() => { try { return format(new Date(field.value), "PP") } catch { return field.value } })() : "Select date"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                                                                setSingleDateOpen(false)
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                <Popover
                                                    open={rangeDateOpen}
                                                    onOpenChange={setRangeDateOpen}
                                                    modal={true}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? (() => {
                                                                try {
                                                                    if (field.value.includes(' - ')) {
                                                                        const [s, e] = field.value.split(' - ')
                                                                        return `${format(new Date(s), "PP")} - ${format(new Date(e), "PP")}`
                                                                    }
                                                                    return format(new Date(field.value), "PP")
                                                                } catch { return field.value }
                                                            })() : "Select date range"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="range"
                                                            selected={dateRange}
                                                            onSelect={(range) => {
                                                                setDateRange(range)
                                                                // Check if we have a complete, valid date range
                                                                if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
                                                                    // Save the range in ISO format and close
                                                                    const formatted = `${format(range.from, "yyyy-MM-dd")} - ${format(range.to, "yyyy-MM-dd")}`
                                                                    field.onChange(formatted)
                                                                    setRangeDateOpen(false)
                                                                    setDateRange(undefined)
                                                                }
                                                            }}
                                                            numberOfMonths={2}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="programTimings"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Program Timings
                                        <Tooltip>
                                            <TooltipTrigger type="button"><Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>Enter the start and end times for the program activities.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Input
                                                    type="time"
                                                    placeholder="Start time"
                                                    value={(field.value || '').split(' - ')[0] || ''}
                                                    onChange={(e) => {
                                                        const endTime = (field.value || '').split(' - ')[1] || ''
                                                        field.onChange(e.target.value + (endTime ? ` - ${endTime}` : ''))
                                                    }}
                                                    className={!isTimeRangeValid() ? 'border-red-500' : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    type="time"
                                                    placeholder="End time"
                                                    value={(field.value || '').split(' - ')[1] || ''}
                                                    onChange={(e) => {
                                                        const startTime = (field.value || '').split(' - ')[0] || ''
                                                        field.onChange((startTime ? `${startTime} - ` : '') + e.target.value)
                                                    }}
                                                    className={!isTimeRangeValid() ? 'border-red-500' : ''}
                                                />
                                            </div>
                                        </div>
                                    </FormControl>
                                    {!isTimeRangeValid() && (
                                        <p className="text-sm font-medium text-destructive">
                                            End time must be after start time
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Location <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Mumbai, Maharashtra" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="trainingDays"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Training / Activity Days
                                        <Tooltip>
                                            <TooltipTrigger type="button"><Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>Enter the actual number of activity or training days. This may differ from the total event duration (e.g., travel days).</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="Enter number of activity days"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="minPax"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Minimum Pax <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="e.g., 20"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="maxPax"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Maximum Pax <span className="text-destructive">*</span>
                                        <Tooltip>
                                            <TooltipTrigger type="button"><Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>Must be greater than or equal to minimum pax.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="e.g., 50"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section 2: Client Contact Details */}
                <div className="border border-border p-6 rounded-xl bg-card shadow-sm mt-8">
                    <h3 className="text-lg font-semibold mb-5 text-green-600 dark:text-green-500">Client Contact Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel className="flex items-center gap-1.5">
                                        Company Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., ABC Corporation" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="companyAddress"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Company Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Full address..." className="h-20" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="clientPOCName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Client POC Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="clientPOCPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Client POC Phone <span className="text-destructive">*</span>
                                        <Tooltip>
                                            <TooltipTrigger type="button"><Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>Must be a valid 10-digit Indian mobile number starting with 6-9.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="10-digit number (9876543210)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="clientPOCEmail"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel className="flex items-center gap-1.5">
                                        Client POC Email <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="john.doe@company.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section 3: Program Requirements */}
                <div className="border border-border p-6 rounded-xl bg-card shadow-sm mt-8">
                    <h3 className="text-lg font-semibold mb-5 text-purple-600 dark:text-purple-400">Program Requirements</h3>

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="previousEngagement"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border bg-muted/30 p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="cursor-pointer">Previous Engagement with Client</FormLabel>
                                        <FormDescription>
                                            Check if this client has worked with us before
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {previousEngagement && (
                            <FormField
                                control={form.control}
                                name="previousEngagementNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Previous Engagement Notes</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Details about previous programs..." className="h-20" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="activityType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            Activity Type <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select activity type..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Outdoor">Outdoor</SelectItem>
                                                <SelectItem value="Indoor">Indoor</SelectItem>
                                                <SelectItem value="Mixed">Mixed</SelectItem>
                                                <SelectItem value="Virtual">Virtual</SelectItem>
                                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="deliveryBudget"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            Delivery Budget (₹) <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="e.g., 150000"
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="activitiesCommitted"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Activities Committed</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="List of activities planned..." className="h-24" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="objectives"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Program Objectives <span className="text-destructive">*</span>
                                        <Tooltip>
                                            <TooltipTrigger type="button"><Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>What does the client want to achieve? Minimum 10 characters required.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Client goals..." className="h-32" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="billingDetails"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billing Details</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Payment terms, GST details, etc." className="h-20" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="photoVideoCommitment"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-border bg-muted/20 p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="leading-none flex items-center gap-1.5 flex-1 cursor-pointer" onClick={() => field.onChange(!field.value)}>
                                        <FormLabel className="cursor-pointer text-sm font-medium leading-none">
                                            Photo/Video Commitment ✓
                                        </FormLabel>
                                        <Tooltip>
                                            <TooltipTrigger type="button" tabIndex={-1} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                Check if we promised photos/videos to the client
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section 3.5: Budget Categorization */}
                <div className="border border-border p-6 rounded-xl bg-card shadow-sm mt-8">
                    <h3 className="text-lg font-semibold mb-2 text-teal-600 dark:text-teal-500">Budget Categorization</h3>
                    <p className="text-sm text-muted-foreground mb-6">Break down the delivery budget by category — helps Finance understand spending allocation.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="budgetVenue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue (₹)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="e.g., 50000"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="budgetTransport"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transport (₹)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="e.g., 20000"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="budgetActivities"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Activities (₹)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="e.g., 40000"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="budgetFood"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Food & Beverages (₹)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="e.g., 30000"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="budgetMiscellaneous"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Miscellaneous (₹)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="e.g., 10000"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="mt-4">
                        <FormField
                            control={form.control}
                            name="budgetNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Budget Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Additional details about spending allocation..." className="h-20" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section 4: Logistics & Venue */}
                <div className="border border-border p-6 rounded-xl bg-card shadow-sm mt-8">
                    <h3 className="text-lg font-semibold mb-5 text-orange-600 dark:text-orange-500">Logistics & Venue</h3>

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="venuePOC"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue POC</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Venue contact person name/number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="specialVenueReq"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Special Venue Requirements</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any special requirements for the venue..." className="h-24" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="eventVendorDetails"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Vendor Details</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Details about external vendors involved..." className="h-20" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section 5: File Uploads */}
                <div className="border border-border p-6 rounded-xl bg-card shadow-sm mt-8">
                    <h3 className="text-lg font-semibold mb-5 text-red-600 dark:text-red-500">Documents</h3>

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="agendaDocument"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agenda Document (Optional)</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label="Upload Agenda"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-gray-500">
                                        Can be uploaded later — agenda is sometimes finalized a day before the program
                                    </FormDescription>
                                    {field.value && (
                                        <a href={field.value} target="_blank" className="text-sm text-blue-600 underline block mt-2">View File</a>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="objectiveDocuments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Objective Documents (Optional)</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label="Upload Objectives"
                                        />
                                    </FormControl>
                                    {field.value && (
                                        <a href={field.value} target="_blank" className="text-sm text-blue-600 underline block mt-2">View File</a>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="submit" disabled={isLoading} size="lg">
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <ArrowRight className="h-5 w-5 mr-2" />}
                        {isEdit ? "Update Program" : "Create Program"}
                    </Button>
                </div>
            </form>
        </Form>
        </TooltipProvider>
    )
}
