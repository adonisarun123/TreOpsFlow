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
import { Loader2, Save, ArrowRight, CalendarIcon } from "lucide-react"
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
    programDates: z.string().optional(),
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
            trainingDays: program?.trainingDays ?? undefined,

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
            deliveryBudget: program?.deliveryBudget ?? undefined,
            billingDetails: program?.billingDetails || '',
            photoVideoCommitment: program?.photoVideoCommitment || false,

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
    })

    // Auto-set or calculate training days based on event type
    useEffect(() => {
        if (!isMultiDay) {
            // Single-day event: always 1 day
            form.setValue('trainingDays', 1)
        } else if (isMultiDay && programDates && programDates.includes(' - ')) {
            // Multi-day event: calculate from date range
            try {
                const [startStr, endStr] = programDates.split(' - ')
                const start = new Date(startStr)
                const end = new Date(endStr)
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    const diffTime = Math.abs(end.getTime() - start.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                    form.setValue('trainingDays', diffDays)
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }, [programDates, isMultiDay, form])

    // Validate time range
    const isTimeRangeValid = () => {
        if (!programTimings || !programTimings.includes(' - ')) return true
        const [start, end] = programTimings.split(' - ')
        if (!start || !end) return true
        return start < end // Compare time strings directly (works for HH:MM format)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Section 1: Basic Program Information */}
                <div className="border p-6 rounded-md bg-white">
                    <h3 className="text-xl font-semibold mb-4 text-blue-800">Basic Program Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="programName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Program Name ⚠️</FormLabel>
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
                                    <FormLabel>Program Type ⚠️</FormLabel>
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
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Multi-Day Event</FormLabel>
                                        <FormDescription>
                                            Check if this program spans multiple days
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
                                                            {field.value ? field.value : "Select date"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date ? format(date, "PP") : "")
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
                                                            {field.value ? field.value : "Select date range"}
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
                                                                    // Save the range and close
                                                                    const formatted = `${format(range.from, "PP")} - ${format(range.to, "PP")}`
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
                                    <FormDescription className="text-xs">
                                        {isMultiDay ? "Select start and end dates" : "Single date picker"}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="programTimings"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Program Timings</FormLabel>
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
                                    <FormDescription className="text-xs">
                                        Select start and end times
                                    </FormDescription>
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
                                    <FormLabel>Location ⚠️</FormLabel>
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
                                    <FormLabel>Training Days</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="Auto-calculated"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            disabled={true}
                                            className="bg-muted"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        {isMultiDay ? 'Auto-calculated from date range' : 'Auto-set to 1 for single-day events'}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="minPax"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Minimum Pax ⚠️</FormLabel>
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
                                    <FormLabel>Maximum Pax ⚠️</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="e.g., 50"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Must be ≥ minimum pax
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section 2: Client Contact Details */}
                <div className="border p-6 rounded-md bg-white">
                    <h3 className="text-xl font-semibold mb-4 text-green-800">Client Contact Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Company Name ⚠️</FormLabel>
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
                                    <FormLabel>Client POC Name ⚠️</FormLabel>
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
                                    <FormLabel>Client POC Phone ⚠️</FormLabel>
                                    <FormControl>
                                        <Input placeholder="10-digit number (9876543210)" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Indian mobile number starting with 6-9
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="clientPOCEmail"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Client POC Email ⚠️</FormLabel>
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
                <div className="border p-6 rounded-md bg-white">
                    <h3 className="text-xl font-semibold mb-4 text-purple-800">Program Requirements</h3>

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="previousEngagement"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Previous Engagement with Client</FormLabel>
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
                                        <FormLabel>Activity Type ⚠️</FormLabel>
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
                                        <FormLabel>Delivery Budget (₹) ⚠️</FormLabel>
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
                                    <FormLabel>Program Objectives ⚠️</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="What does the client want to achieve?" className="h-32" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Minimum 10 characters required
                                    </FormDescription>
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
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-yellow-50">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Photo/Video Commitment Required</FormLabel>
                                        <FormDescription>
                                            Check if client needs photos/videos
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section 4: Logistics & Venue */}
                <div className="border p-6 rounded-md bg-white">
                    <h3 className="text-xl font-semibold mb-4 text-orange-800">Logistics & Venue</h3>

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
                <div className="border p-6 rounded-md bg-white">
                    <h3 className="text-xl font-semibold mb-4 text-red-800">Documents</h3>

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="agendaDocument"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agenda Document ⚠️</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            onUploadComplete={field.onChange}
                                            currentFile={field.value}
                                            label="Upload Agenda"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-red-600 font-medium">
                                        Required for handover to Ops
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
    )
}
