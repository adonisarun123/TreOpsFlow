"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
    id: string
    message: string
    type: ToastType
}

let toastIdCounter = 0
let toastListeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: ToastType = "info") {
    const toast: Toast = {
        id: `toast-${toastIdCounter++}`,
        message,
        type,
    }
    toastListeners.forEach(listener => listener(toast))
}

export function Toaster() {
    const [toasts, setToasts] = useState<Toast[]>([])

    useEffect(() => {
        const listener = (toast: Toast) => {
            setToasts(prev => [...prev, toast])

            // Auto-remove after 4 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id))
            }, 4000)
        }

        toastListeners.push(listener)

        return () => {
            toastListeners = toastListeners.filter(l => l !== listener)
        }
    }, [])

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
            flex items-start gap-3 p-4 rounded-lg shadow-lg border
            animate-in slide-in-from-right duration-300
            ${toast.type === "success" ? "bg-green-50 border-green-200" : ""}
            ${toast.type === "error" ? "bg-red-50 border-red-200" : ""}
            ${toast.type === "info" ? "bg-blue-50 border-blue-200" : ""}
          `}
                >
                    {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />}
                    {toast.type === "error" && <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
                    {toast.type === "info" && <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />}

                    <p className={`text-sm flex-1 ${toast.type === "success" ? "text-green-900" : ""
                        }${toast.type === "error" ? "text-red-900" : ""}
          ${toast.type === "info" ? "text-blue-900" : ""}`}>
                        {toast.message}
                    </p>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
