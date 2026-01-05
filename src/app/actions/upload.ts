'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/auth'

export async function uploadFile(formData: FormData) {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    const file = formData.get('file') as File
    if (!file) {
        return { error: 'No file uploaded' }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
        await mkdir(uploadDir, { recursive: true })
    } catch (e) {
        console.error("Failed to create upload dir", e)
    }

    // Create unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const path = join(uploadDir, filename)

    try {
        await writeFile(path, buffer)
        return { success: true, url: `/uploads/${filename}` }
    } catch (e) {
        console.error('Upload failed', e)
        return { error: 'Failed to write file' }
    }
}
