-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");

-- CreateIndex
CREATE INDEX "ProgramCard_currentStage_idx" ON "ProgramCard"("currentStage");

-- CreateIndex
CREATE INDEX "ProgramCard_createdAt_idx" ON "ProgramCard"("createdAt");

-- CreateIndex
CREATE INDEX "ProgramCard_salesPOCId_idx" ON "ProgramCard"("salesPOCId");

-- CreateIndex
CREATE INDEX "ProgramCard_opsSPOCId_idx" ON "ProgramCard"("opsSPOCId");

-- CreateIndex
CREATE INDEX "ProgramCard_rejectionStatus_idx" ON "ProgramCard"("rejectionStatus");

-- CreateIndex
CREATE INDEX "ProgramCard_currentStage_financeApprovalReceived_idx" ON "ProgramCard"("currentStage", "financeApprovalReceived");

-- CreateIndex
CREATE INDEX "ProgramCard_currentStage_handoverAcceptedByOps_idx" ON "ProgramCard"("currentStage", "handoverAcceptedByOps");

-- CreateIndex
CREATE INDEX "StageTransition_programCardId_idx" ON "StageTransition"("programCardId");

-- CreateIndex
CREATE INDEX "StageTransition_transitionedAt_idx" ON "StageTransition"("transitionedAt");

-- CreateIndex
CREATE INDEX "StageTransition_transitionedBy_idx" ON "StageTransition"("transitionedBy");
