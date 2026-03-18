"use client"

import { Button } from "@/components/ui/button"
import { FileText, Loader2, ChevronDown, FileDown } from "lucide-react"
import { useState } from "react"
import { showToast } from "@/components/ui/toaster"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FreelancerExportButtonProps {
    programId: string
    variant?: "default" | "outline" | "secondary" | "ghost"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
}

export function FreelancerExportButton({ programId, variant = "outline", size = "sm", className }: FreelancerExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    async function handleExport(formatType: "md" | "txt" | "pdf") {
        setIsExporting(true)
        try {
            const res = await fetch(`/api/programs/${programId}/export-freelancer?format=${formatType}`, {
                method: "GET",
            })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(text || "Export failed")
            }

            // Get filename from Content-Disposition if available
            let filename = `program-${programId}-export.${formatType}`
            const disposition = res.headers.get("Content-Disposition")
            if (disposition && disposition.indexOf("attachment") !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
                const matches = filenameRegex.exec(disposition)
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, "")
                }
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            a.remove()

            showToast("Freelancer details exported successfully", "success")
        } catch (error: unknown) {
            console.error("Export error:", error)
            showToast(`Error: ${(error as Error)?.message || "Failed to export details"}`, "error")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={`gap-1.5 ${className || ""}`}
                    disabled={isExporting}
                    title="Download safe export without private financial data"
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    ) : (
                        <FileText className="h-4 w-4 shrink-0" />
                    )}
                    <span className="hidden sm:inline">Export for Freelancer</span>
                    <span className="sm:hidden">Export</span>
                    <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Choose format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2">
                    <FileDown className="h-4 w-4 text-red-500" />
                    <div>
                        <p className="text-sm font-medium">PDF Document</p>
                        <p className="text-xs text-muted-foreground">Formatted & print-ready</p>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("txt")} className="gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                        <p className="text-sm font-medium">Text Document (.txt)</p>
                        <p className="text-xs text-muted-foreground">Plain text format</p>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("md")} className="gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <div>
                        <p className="text-sm font-medium">Markdown (.md)</p>
                        <p className="text-xs text-muted-foreground">For technical users</p>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
