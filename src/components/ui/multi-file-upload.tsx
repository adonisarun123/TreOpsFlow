"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { uploadFile } from "@/app/actions/upload"
import { Loader2, Upload, FileIcon, X } from "lucide-react"
import { showToast } from "@/components/ui/toaster"
import { parseFileList, serializeFileList, type FileEntry } from "@/lib/file-list"

interface MultiFileUploadProps {
    onChange: (serialized: string) => void
    label?: string
    value?: string
    acceptedFileTypes?: string[]
    disabled?: boolean
}

export function MultiFileUpload({
    onChange,
    label = "Upload Files",
    value,
    acceptedFileTypes,
    disabled = false,
}: MultiFileUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [files, setFiles] = useState<FileEntry[]>(() => parseFileList(value))

    function commit(next: FileEntry[]) {
        setFiles(next)
        onChange(serializeFileList(next))
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length || disabled) return

        const selected = Array.from(e.target.files)

        if (acceptedFileTypes && acceptedFileTypes.length > 0) {
            const bad = selected.find((f) => {
                const ext = f.name.split('.').pop()?.toLowerCase()
                return !ext || !acceptedFileTypes.includes(ext)
            })
            if (bad) {
                const acceptedList = acceptedFileTypes.map((ext) => `.${ext}`).join(', ')
                showToast(`Invalid file type. Accepted types: ${acceptedList}`, "error")
                e.target.value = ''
                return
            }
        }

        setIsUploading(true)
        const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'webm']
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif']
        const uploaded: FileEntry[] = []

        try {
            for (const file of selected) {
                const formData = new FormData()
                formData.append('file', file)
                const ext = file.name.split('.').pop()?.toLowerCase() || ''
                formData.append('fileType', videoExtensions.includes(ext) || imageExtensions.includes(ext) ? 'media' : 'document')

                const result = await uploadFile(formData)
                if (result.success && result.url) {
                    uploaded.push({ url: result.url, name: file.name })
                } else {
                    showToast(`Upload Error (${file.name}): ${result.error || 'Upload failed'}`, "error")
                }
            }
            if (uploaded.length > 0) commit([...files, ...uploaded])
        } catch (err: unknown) {
            const msg = (err as Error)?.message || String(err) || "Error uploading file"
            showToast(`Upload Error: ${msg}`, "error")
            console.error("Upload exception:", err)
        } finally {
            setIsUploading(false)
            e.target.value = ''
        }
    }

    function removeAt(idx: number) {
        if (disabled) return
        commit(files.filter((_, i) => i !== idx))
    }

    const inputId = `multi-file-upload-${label.replace(/\s+/g, '-')}`
    const acceptAttribute = acceptedFileTypes ? acceptedFileTypes.map((ext) => `.${ext}`).join(',') : undefined

    return (
        <div className="space-y-2">
            <div>
                <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    disabled={isUploading || disabled}
                    className="hidden"
                    id={inputId}
                    accept={acceptAttribute}
                />
                <label htmlFor={inputId} className="block">
                    <Button type="button" variant="outline" disabled={isUploading || disabled} className="w-full" asChild>
                        <span>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {isUploading ? "Uploading..." : label}
                        </span>
                    </Button>
                </label>
            </div>
            {files.length > 0 && (
                <ul className="space-y-1">
                    {files.map((f, idx) => (
                        <li key={`${f.url}-${idx}`} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                            <FileIcon className="h-4 w-4 shrink-0" />
                            <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm truncate text-blue-600 hover:underline flex-1"
                            >
                                {f.name || f.url.split('/').pop() || 'File'}
                            </a>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAt(idx)}
                                disabled={disabled}
                                className="h-6 w-6"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
