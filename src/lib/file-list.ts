export type FileEntry = { url: string; name?: string }

/**
 * Parse a stored file-list value. Supports:
 * - JSON array of { url, name? } or plain URL strings
 * - Legacy single URL string (unparsed)
 * - null / undefined / "" → []
 */
export function parseFileList(value: string | null | undefined): FileEntry[] {
    if (!value) return []
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item): FileEntry | null => {
                        if (typeof item === 'string') return { url: item }
                        if (item && typeof item === 'object' && typeof item.url === 'string') {
                            return { url: item.url, name: typeof item.name === 'string' ? item.name : undefined }
                        }
                        return null
                    })
                    .filter((f): f is FileEntry => !!f && !!f.url)
            }
        } catch {
            // fallthrough: treat as legacy single URL
        }
    }
    return [{ url: trimmed }]
}

export function serializeFileList(files: FileEntry[]): string {
    if (!files || files.length === 0) return ''
    return JSON.stringify(files)
}

export function fileListUrls(value: string | null | undefined): string[] {
    return parseFileList(value).map((f) => f.url)
}
