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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { createProgram } from "@/app/actions/program"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

const programFormSchema = z.object({
    programName: z.string().min(2, {
        message: "Program name must be at least 2 characters.",
    }),
    programType: z.string().min(1, { message: "Program type is required" }),
    location: z.string().min(1, { message: "Location is required" }),
    minPax: z.string().optional(), // Input is text, convert to number
    maxPax: z.string().optional(),

    clientPOCName: z.string().min(1, "Client POC Name is required"),
    clientPOCPhone: z.string().min(10, "Valid phone number required").max(15),
    clientPOCEmail: z.string().email("Invalid email"),
    companyName: z.string().min(1, "Company name is required"),

    deliveryBudget: z.string().min(1, "Budget is required"),

    // Dates can be complex, let's just stick to a single date or string for MVP complexity reduction if needed,
    // but doc says "Array<Date>". Let's use a simple single date picker for start date for now or handle array manually.
    // Using a single date for simplicity in MVP step 1.
    programDate: z.date({ required_error: "A date is required." }),
})

export function ProgramForm() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof programFormSchema>>({
        resolver: zodResolver(programFormSchema),
        defaultValues: {
            programName: "",
            programType: "",
            location: "",
            minPax: "",
            maxPax: "",
            clientPOCName: "",
            clientPOCPhone: "",
            clientPOCEmail: "",
            companyName: "",
            deliveryBudget: "",
        },
    })

    async function onSubmit(values: z.infer<typeof programFormSchema>) {
        setIsLoading(true)
        try {
            // Convert strings to numbers
            const payload = {
                ...values,
                minPax: values.minPax ? parseInt(values.minPax) : undefined,
                maxPax: values.maxPax ? parseInt(values.maxPax) : undefined,
                deliveryBudget: parseFloat(values.deliveryBudget),
                programDates: [values.programDate.toISOString()], // Wrap in array
            }

            const result = await createProgram(payload)

            if (result.error) {
                // Show error (toast)
                alert(result.error)
            } else {
                router.push(`/dashboard/programs/${result.programId}`)
            }
        } catch (error) {
            console.error(error)
            alert("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Program Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Program Details</h3>
                        <FormField
                            control={form.control}
                            name="programName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Program Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Leadership Summit 2024" {...field} />
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
                                    <FormLabel>Program Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="E2E">E2E (End-to-End)</SelectItem>
                                            <SelectItem value="Day">Day Outing</SelectItem>
                                            <SelectItem value="Virtual">Virtual</SelectItem>
                                            <SelectItem value="OBL">Outbound Learning</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="programDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Program Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location / Venue</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Resort Name or City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-4">
                            <FormField
                                control={form.control}
                                name="minPax"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Min Pax</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxPax"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Max Pax</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="50" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Client & Commercials */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Client & Commercials</h3>
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Corp" {...field} />
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
                                    <FormLabel>Client POC Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="clientPOCEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="john@acme.com" {...field} />
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
                                    <FormLabel>Client Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="9876543210" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="deliveryBudget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Delivery Budget (₹)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="50000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Program Card
                </Button>
            </form>
        </Form>
    )
}
