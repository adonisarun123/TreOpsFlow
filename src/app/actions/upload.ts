'use server'

import { auth } from '@/auth'
import { uploadToImageKit } from '@/lib/imagekit'
import { isValidFileSize, isValidDocumentType, isValidMediaType } from '@/lib/validations'

export async function uploadFile(formData: FormData) {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    const file = formData.get('file') as File
    if (!file) {
        return { error: 'No file uploaded' }
    }

    // Validate file size (10MB limit per documentation)
    if (!isValidFileSize(file.size)) {
        return { error: 'File size must not exceed 10MB' }
    }

    // Determine file type and validate
    const fileType = formData.get('fileType') as string || 'document' // 'document' or 'media'
    const isValid = fileType === 'media'
        ? isValidMediaType(file.name)
        : isValidDocumentType(file.name)

    if (!isValid) {
        if (fileType === 'media') {
            return { error: 'Only JPG, PNG, MP4, MOV files allowed for media' }
        } else {
            return { error: 'Only PDF, DOC, DOCX, XLS, XLSX files allowed for documents' }
        }
    }

    try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to ImageKit
        const folder = `trebound-workflow/${fileType}s`
        const result = await uploadToImageKit(buffer, file.name, folder)

        return {
            success: true,
            url: result.url,
            fileId: result.fileId
        }
    } catch (error) {
        console.error('ImageKit upload failed:', error)
        return { error: 'Failed to upload file to storage' }
    }
}

// Get ImageKit authentication for client-side uploads (optional)
export async function getUploadAuth() {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    // Return ImageKit public key for client-side uploads
    return {
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    }
}
