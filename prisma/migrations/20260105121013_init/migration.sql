-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProgramCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    "deliveryBudget" REAL,
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
    "packingCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "packingOwner" TEXT,
    "setupOnTime" BOOLEAN,
    "activitiesExecuted" TEXT,
    "actualParticipantCount" INTEGER,
    "tripExpenseSheet" TEXT,
    "photosVideos" TEXT,
    "googleReviewReceived" BOOLEAN NOT NULL DEFAULT false,
    "videoTestimonialReceived" BOOLEAN NOT NULL DEFAULT false,
    "opsDataManagerUpdated" BOOLEAN NOT NULL DEFAULT false,
    "expensesBillsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "zfdRating" INTEGER,
    "zfdComments" TEXT,
    "closedAt" DATETIME,
    "closedBy" TEXT,
    "finalNotes" TEXT,
    CONSTRAINT "ProgramCard_salesPOCId_fkey" FOREIGN KEY ("salesPOCId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProgramCard_opsSPOCId_fkey" FOREIGN KEY ("opsSPOCId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StageTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programCardId" TEXT NOT NULL,
    "fromStage" INTEGER NOT NULL,
    "toStage" INTEGER NOT NULL,
    "transitionedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transitionedBy" TEXT NOT NULL,
    "approvalNotes" TEXT,
    CONSTRAINT "StageTransition_programCardId_fkey" FOREIGN KEY ("programCardId") REFERENCES "ProgramCard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StageTransition_transitionedBy_fkey" FOREIGN KEY ("transitionedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCard_programId_key" ON "ProgramCard"("programId");
