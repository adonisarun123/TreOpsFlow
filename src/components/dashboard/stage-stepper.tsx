"use client"

import { Check } from "lucide-react"

interface StageStepperProps {
    currentStage: number
    compact?: boolean
}

const STAGES = [
    { id: 1, name: "Tentative", color: "amber" },
    { id: 2, name: "Accepted", color: "blue" },
    { id: 3, name: "Feasibility", color: "violet" },
    { id: 4, name: "Delivery", color: "emerald" },
    { id: 5, name: "Post Trip", color: "orange" },
    { id: 6, name: "Done", color: "slate" },
]

export function StageStepper({ currentStage, compact = false }: StageStepperProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between">
                {STAGES.map((stage, index) => {
                    const isCompleted = currentStage > stage.id
                    const isCurrent = currentStage === stage.id
                    const isUpcoming = currentStage < stage.id

                    const dotColors: Record<string, { done: string; active: string; ring: string }> = {
                        amber:   { done: "bg-amber-500",   active: "bg-amber-500",   ring: "ring-amber-200 dark:ring-amber-800" },
                        blue:    { done: "bg-blue-500",    active: "bg-blue-500",    ring: "ring-blue-200 dark:ring-blue-800" },
                        violet:  { done: "bg-violet-500",  active: "bg-violet-500",  ring: "ring-violet-200 dark:ring-violet-800" },
                        emerald: { done: "bg-emerald-500", active: "bg-emerald-500", ring: "ring-emerald-200 dark:ring-emerald-800" },
                        orange:  { done: "bg-orange-500",  active: "bg-orange-500",  ring: "ring-orange-200 dark:ring-orange-800" },
                        slate:   { done: "bg-slate-500",   active: "bg-slate-500",   ring: "ring-slate-200 dark:ring-slate-700" },
                    }

                    const colors = dotColors[stage.color] || dotColors.slate

                    return (
                        <div key={stage.id} className="flex items-center flex-1 last:flex-initial">
                            <div className="flex flex-col items-center">
                                {/* Dot / Check */}
                                <div className={`
                                    ${compact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6 sm:h-8 sm:w-8"} rounded-full flex items-center justify-center
                                    transition-all duration-300 shrink-0
                                    ${isCompleted
                                        ? `${colors.done} text-white`
                                        : isCurrent
                                            ? `${colors.active} text-white ring-2 sm:ring-4 ${colors.ring} shadow-sm`
                                            : "bg-muted text-muted-foreground border-2 border-border"
                                    }
                                `}>
                                    {isCompleted ? (
                                        <Check className={compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3 sm:h-4 sm:w-4"} strokeWidth={3} />
                                    ) : (
                                        <span className={`font-bold ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"}`}>{stage.id}</span>
                                    )}
                                </div>

                                {/* Label - hidden on very small screens in compact mode */}
                                {!compact && (
                                    <span className={`
                                        mt-1 sm:mt-1.5 text-[7px] sm:text-[11px] font-medium text-center whitespace-nowrap
                                        ${isCurrent ? "text-foreground" : "text-muted-foreground"}
                                    `}>
                                        {stage.name}
                                    </span>
                                )}
                            </div>

                            {/* Connector line */}
                            {index < STAGES.length - 1 && (
                                <div className={`
                                    flex-1 ${compact ? "h-[1.5px] mx-0.5 sm:mx-1" : "h-0.5 mx-0.5 sm:mx-2"} rounded-full
                                    ${isCompleted ? colors.done : "bg-border"}
                                    ${compact ? "mb-0" : "mb-4 sm:mb-5"}
                                    transition-colors duration-300
                                `} />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
