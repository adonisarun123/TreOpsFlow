-- AlterTable
ALTER TABLE "ProgramCard" ADD COLUMN     "financeRejectionReason" TEXT,
ADD COLUMN     "lastResubmittedAt" TIMESTAMP(3),
ADD COLUMN     "opsRejectionReason" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectionStatus" TEXT,
ADD COLUMN     "resubmissionCount" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "ProgramCard" ADD CONSTRAINT "ProgramCard_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
