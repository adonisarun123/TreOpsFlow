"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { uploadFile } from "@/app/actions/upload"
import { Loader2, Upload, FileIcon, X } from "lucide-react"

interface FileUploadProps {
    onUploadComplete: (url: string) => void
    label?: string
    currentFile?: string
}

export function FileUpload({ onUploadComplete, label = "Upload File", currentFile }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [fileName, setFileName] = useState<string | null>(currentFile ? currentFile.split('/').pop() || "Attached File" : null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', e.target.files[0])

        try {
            const result = await uploadFile(formData)
            if (result.success && result.url) {
                onUploadComplete(result.url)
                setFileName(e.target.files[0].name)
            } else {
                alert("Upload failed")
            }
        } catch (e) {
            console.error(e)
            alert("Error uploading file")
        } finally {
            setIsUploading(false)
        }
    }

    function removeFile() {
        onUploadComplete("")
        setFileName(null)
    }

    if (fileName) {
        return (
            <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                <FileIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={removeFile}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={isUploading}>
                <label className="cursor-pointer flex items-center gap-2">
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>{label}</span>
                    <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
            </Button>
        </div>
    )
}
