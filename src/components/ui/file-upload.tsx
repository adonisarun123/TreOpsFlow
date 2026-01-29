"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { uploadFile } from "@/app/actions/upload"
import { Loader2, Upload, FileIcon, X } from "lucide-react"
import { showToast } from "@/components/ui/toaster"

interface FileUploadProps {
    onUploadComplete: (url: string) => void
    label?: string
    currentFile?: string
    acceptedFileTypes?: string[] // Array of file extensions without dots, e.g., ['mp4', 'mov', 'pdf']
    disabled?: boolean // Disable upload and remove buttons (for read-only mode)
}

export function FileUpload({
    onUploadComplete,
    label = "Upload File",
    currentFile,
    acceptedFileTypes,
    disabled = false
}: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [fileName, setFileName] = useState<string | null>(currentFile ? currentFile.split('/').pop() || "Attached File" : null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length || disabled) return

        const file = e.target.files[0]

        // Validate file type if acceptedFileTypes is specified
        if (acceptedFileTypes && acceptedFileTypes.length > 0) {
            const fileExtension = file.name.split('.').pop()?.toLowerCase()
            if (!fileExtension || !acceptedFileTypes.includes(fileExtension)) {
                const acceptedList = acceptedFileTypes.map(ext => `.${ext}`).join(', ')
                showToast(`Invalid file type. Accepted types: ${acceptedList}`, "error")
                e.target.value = '' // Clear the input
                return
            }
        }

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        // Determine file type based on extension
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'webm']
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif']

        if (videoExtensions.includes(fileExtension || '') || imageExtensions.includes(fileExtension || '')) {
            formData.append('fileType', 'media')
        } else {
            formData.append('fileType', 'document')
        }

        try {
            const result = await uploadFile(formData)
            if (result.success && result.url) {
                onUploadComplete(result.url)
                setFileName(file.name)
            } else {
                // Show the actual error message from server
                const errorMsg = result.error || "Upload failed"
                showToast(`Upload Error: ${errorMsg}`, "error")
                console.error("Upload failed:", result)
            }
        } catch (e: any) {
            // Show detailed error from exception
            const errorMsg = e?.message || e?.toString() || "Error uploading file"
            showToast(`Upload Error: ${errorMsg}`, "error")
            console.error("Upload exception:", e)
        } finally {
            setIsUploading(false)
            e.target.value = '' // Clear the input after upload
        }
    }

    function removeFile() {
        if (disabled) return
        onUploadComplete("")
        setFileName(null)
    }

    // Create accept attribute for input based on acceptedFileTypes
    const acceptAttribute = acceptedFileTypes
        ? acceptedFileTypes.map(ext => `.${ext}`).join(',')
        : undefined

    return (
        <div className="flex items-center gap-2">
            <Input
                type="file"
                onChange={handleFileChange}
                disabled={isUploading || disabled}
                className="hidden"
                id={`file-upload-${label.replace(/\s+/g, '-')}`}
                accept={acceptAttribute}
            />
            <label htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`} className="flex-1">
                <Button type="button" variant="outline" disabled={isUploading || disabled} className="w-full" asChild>
                    <span>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isUploading ? "Uploading..." : label}
                    </span>
                </Button>
            </label>
            {fileName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                    <FileIcon className="h-4 w-4" />
                    {currentFile ? (
                        <a
                            href={currentFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm truncate max-w-[200px] text-blue-600 hover:underline"
                        >
                            {fileName}
                        </a>
                    ) : (
                        <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                    )}
                    <Button type="button" variant="ghost" size="icon" onClick={removeFile} disabled={disabled} className="h-6 w-6">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}
