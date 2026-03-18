'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { updateAppSetting } from "@/app/actions/settings"
import { Loader2, Check, ExternalLink } from "lucide-react"

interface SheetUrlFormProps {
    opsDataEntrySheetUrl: string
    tripExpenseSheetUrl: string
}

export function SheetUrlForm({ opsDataEntrySheetUrl, tripExpenseSheetUrl }: SheetUrlFormProps) {
    const [opsUrl, setOpsUrl] = useState(opsDataEntrySheetUrl)
    const [tripUrl, setTripUrl] = useState(tripExpenseSheetUrl)
    const [saving, setSaving] = useState<string | null>(null)
    const [saved, setSaved] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function handleSave(key: string, value: string) {
        setSaving(key)
        setError(null)
        setSaved(null)
        const result = await updateAppSetting(key, value)
        setSaving(null)
        if (result.error) {
            setError(result.error)
        } else {
            setSaved(key)
            setTimeout(() => setSaved(null), 2000)
        }
    }

    return (
        <div className="space-y-4">
            {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
            )}

            <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Ops Data Entry Sheet URL</Label>
                <div className="flex gap-2">
                    <Input
                        value={opsUrl}
                        onChange={(e) => setOpsUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="flex-1 text-xs"
                    />
                    <Button
                        size="sm"
                        onClick={() => handleSave('opsDataEntrySheetUrl', opsUrl)}
                        disabled={saving === 'opsDataEntrySheetUrl' || !opsUrl.trim()}
                    >
                        {saving === 'opsDataEntrySheetUrl' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : saved === 'opsDataEntrySheetUrl' ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                            "Save"
                        )}
                    </Button>
                </div>
                {opsUrl && (
                    <a href={opsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        Open sheet <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Trip Expense Sheet URL</Label>
                <div className="flex gap-2">
                    <Input
                        value={tripUrl}
                        onChange={(e) => setTripUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="flex-1 text-xs"
                    />
                    <Button
                        size="sm"
                        onClick={() => handleSave('tripExpenseSheetUrl', tripUrl)}
                        disabled={saving === 'tripExpenseSheetUrl' || !tripUrl.trim()}
                    >
                        {saving === 'tripExpenseSheetUrl' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : saved === 'tripExpenseSheetUrl' ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                            "Save"
                        )}
                    </Button>
                </div>
                {tripUrl && (
                    <a href={tripUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        Open sheet <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                )}
            </div>
        </div>
    )
}
