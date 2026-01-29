-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramCard" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "programName" TEXT NOT NULL,
    "programType" TEXT,
    "programDates" TEXT,
    "programTimings" TEXT,
    "location" TEXT,
    "minPax" INTEGER,
    "maxPax" INTEGER,
    "trainingDays" INTEGER,
    "salesPOCId" TEXT,
    "clientPOCName" TEXT,
    "clientPOCPhone" TEXT,
    "clientPOCEmail" TEXT,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "activityType" TEXT,
    "activitiesCommitted" TEXT,
    "objectives" TEXT,
    "agendaDocument" TEXT,
    "deliveryBudget" DOUBLE PRECISION,
    "billingDetails" TEXT,
    "photoVideoCommitment" BOOLEAN NOT NULL DEFAULT false,
    "venuePOC" TEXT,
    "specialVenueReq" TEXT,
    "opsSPOCId" TEXT,
    "financeApprovalReceived" BOOLEAN NOT NULL DEFAULT false,
    "financeApprovalEmail" TEXT,
    "handoverAcceptedByOps" BOOLEAN NOT NULL DEFAULT false,
    "handoverIssues" TEXT,
    "facilitatorsBlocked" TEXT,
    "helperStaffBlocked" TEXT,
    "transportBlocked" TEXT,
    "agendaWalkthroughDone" BOOLEAN NOT NULL DEFAULT false,
    "logisticsList" TEXT,
    "travelPlanFinalized" BOOLEAN NOT NULL DEFAULT false,
    "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "allResourcesBlocked" BOOLEAN NOT NULL DEFAULT false,
    "logisticsListLocked" BOOLEAN NOT NULL DEFAULT false,
    "prepComplete" BOOLEAN NOT NULL DEFAULT false,
    "venueReached" BOOLEAN NOT NULL DEFAULT false,
    "facilitatorsReached" BOOLEAN NOT NULL DEFAULT false,
    "programCompleted" BOOLEAN NOT NULL DEFAULT false,
    "deliveryNotes" TEXT,
    "initialExpenseSheet" TEXT,
    "packingCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "packingOwner" TEXT,
    "setupOnTime" BOOLEAN,
    "activitiesExecuted" TEXT,
    "actualParticipantCount" INTEGER,
    "tripExpenseSheet" TEXT,
    "photosVideos" TEXT,
    "npsScore" INTEGER,
    "clientFeedback" TEXT,
    "finalInvoiceSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "vendorPaymentsClear" BOOLEAN NOT NULL DEFAULT false,
    "googleReviewReceived" BOOLEAN NOT NULL DEFAULT false,
    "videoTestimonialReceived" BOOLEAN NOT NULL DEFAULT false,
    "opsDataManagerUpdated" BOOLEAN NOT NULL DEFAULT false,
    "expensesBillsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "zfdRating" INTEGER,
    "zfdComments" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "finalNotes" TEXT,

    CONSTRAINT "ProgramCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageTransition" (
    "id" TEXT NOT NULL,
    "programCardId" TEXT NOT NULL,
    "fromStage" INTEGER NOT NULL,
    "toStage" INTEGER NOT NULL,
    "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transitionedBy" TEXT NOT NULL,
    "approvalNotes" TEXT,

    CONSTRAINT "StageTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCard_programId_key" ON "ProgramCard"("programId");

-- AddForeignKey
ALTER TABLE "ProgramCard" ADD CONSTRAINT "ProgramCard_salesPOCId_fkey" FOREIGN KEY ("salesPOCId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCard" ADD CONSTRAINT "ProgramCard_opsSPOCId_fkey" FOREIGN KEY ("opsSPOCId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageTransition" ADD CONSTRAINT "StageTransition_programCardId_fkey" FOREIGN KEY ("programCardId") REFERENCES "ProgramCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageTransition" ADD CONSTRAINT "StageTransition_transitionedBy_fkey" FOREIGN KEY ("transitionedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
