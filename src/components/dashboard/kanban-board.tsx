"use client"

import { useState, useEffect } from "react"
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { StageTransitionModal } from "./stage-transition-modal"
import { StageReturnModal } from "./stage-return-modal"
import { ProgramViewModal } from "./program-view-modal"
import { showToast } from "@/components/ui/toaster"
import { DeleteProgramModal } from "@/components/ui/delete-program-modal"
import { useRouter } from "next/navigation"
import type { ProgramWithSalesOwner } from "@/types"

interface KanbanBoardProps {
    initialPrograms: ProgramWithSalesOwner[]
    userRole?: string
    userId?: string
}

const STAGES = [
    { id: "1", title: "Tentative Handover" },
    { id: "2", title: "Accepted Handover" },
    { id: "3", title: "Feasibility Check & Preps" },
    { id: "4", title: "Delivery" },
    { id: "5", title: "Post Trip Closure" },
    { id: "6", title: "Done" },
]

export function KanbanBoard({ initialPrograms, userRole, userId }: KanbanBoardProps) {
    const [programs, setPrograms] = useState<ProgramWithSalesOwner[]>(initialPrograms)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [draggingProgram, setDraggingProgram] = useState<ProgramWithSalesOwner | null>(null)

    // Forward transition modal state
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false)
    // Backward return modal state
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
    // View modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [viewProgram, setViewProgram] = useState<ProgramWithSalesOwner | null>(null)

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ProgramWithSalesOwner | null>(null)

    const [pendingTransition, setPendingTransition] = useState<{ programId: string, targetStage: number } | null>(null)
    const [transitionProgram, setTransitionProgram] = useState<ProgramWithSalesOwner | null>(null)

    const router = useRouter()

    useEffect(() => {
        setPrograms(initialPrograms)
    }, [initialPrograms])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag (allows clicks without triggering drag)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragStart(event: DragStartEvent) {
        const { active } = event
        setActiveId(active.id as string)
        const program = programs.find((p) => p.id === active.id)
        setDraggingProgram(program ?? null)
    }

    function handleDragOver(_event: DragOverEvent) {
        // Optimistic sorting could be added here
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)
        setDraggingProgram(null)

        if (!over) return

        // Finance users cannot move cards between stages
        if (userRole === 'Finance') {
            showToast("Finance users cannot move programs between stages", "info")
            return
        }

        const activeId = active.id as string
        const overId = over.id as string

        const program = programs.find((p) => p.id === activeId)
        if (!program) return

        let targetStageId = overId
        const overProgram = programs.find(p => p.id === overId)
        if (overProgram) {
            targetStageId = String(overProgram.currentStage)
        }

        const isColumn = STAGES.some(s => s.id === targetStageId)
        if (!isColumn) return

        let targetStage = parseInt(targetStageId)
        const currentStage = program.currentStage

        if (targetStage === currentStage) return

        // Cap forward movement to one stage at a time
        if (targetStage > currentStage) {
            if (targetStage > currentStage + 1) {
                showToast("Cards can only move one stage at a time", "info")
                targetStage = currentStage + 1
            }
            setPendingTransition({ programId: activeId, targetStage })
            setTransitionProgram(program)
            setIsForwardModalOpen(true)
        } else {
            setPendingTransition({ programId: activeId, targetStage })
            setTransitionProgram(program)
            setIsReturnModalOpen(true)
        }
    }

    function handleCardClick(program: ProgramWithSalesOwner) {
        setViewProgram(program)
        setIsViewModalOpen(true)
    }

    function handleDeleteRequest(program: ProgramWithSalesOwner) {
        setDeleteTarget(program)
        setIsDeleteModalOpen(true)
    }

    async function handleDeleteConfirm(reason: string) {
        if (!deleteTarget) return
        const res = await fetch(`/api/programs/${deleteTarget.id}/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to delete')
        showToast('Program deleted successfully', 'success')
        setIsDeleteModalOpen(false)
        setDeleteTarget(null)
        router.refresh()
    }

    function handleForwardConfirm() {
        setIsForwardModalOpen(false)
        setPendingTransition(null)
        setTransitionProgram(null)
        router.refresh()
    }

    function handleReturnConfirm() {
        setIsReturnModalOpen(false)
        setPendingTransition(null)
        setTransitionProgram(null)
        router.refresh()
    }

    function handleModalClose() {
        setIsForwardModalOpen(false)
        setIsReturnModalOpen(false)
        setPendingTransition(null)
        setTransitionProgram(null)
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-280px)] md:h-[calc(100vh-220px)] overflow-x-auto gap-2 md:gap-4 pb-4 -mx-3 px-3 md:mx-0 md:px-0">
                {STAGES.map((stage) => (
                    <KanbanColumn
                        key={stage.id}
                        id={stage.id}
                        title={stage.title}
                        programs={programs.filter((p) => p.currentStage === parseInt(stage.id))}
                        onCardClick={handleCardClick}
                        userRole={userRole}
                        onDelete={userRole === 'Admin' ? handleDeleteRequest : undefined}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeId && draggingProgram ? (
                    <KanbanCard program={draggingProgram} />
                ) : null}
            </DragOverlay>

            {/* Forward transition modal (drag right) */}
            <StageTransitionModal
                isOpen={isForwardModalOpen}
                onClose={handleModalClose}
                onConfirm={handleForwardConfirm}
                program={transitionProgram}
                targetStage={pendingTransition?.targetStage || 0}
            />

            {/* Backward return modal (drag left) */}
            <StageReturnModal
                isOpen={isReturnModalOpen}
                onClose={handleModalClose}
                onConfirm={handleReturnConfirm}
                program={transitionProgram}
                targetStage={pendingTransition?.targetStage || 0}
            />

            {/* View modal (click card) */}
            <ProgramViewModal
                isOpen={isViewModalOpen}
                onClose={() => { setIsViewModalOpen(false); setViewProgram(null) }}
                program={viewProgram}
                userRole={userRole}
                userId={userId}
            />

            {/* Delete modal (Admin only) */}
            {deleteTarget && (
                <DeleteProgramModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null) }}
                    onSubmit={handleDeleteConfirm}
                    programName={deleteTarget.programName}
                    programId={deleteTarget.programId}
                />
            )}
        </DndContext>
    )
}
