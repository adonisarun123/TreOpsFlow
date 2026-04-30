-- AlterTable
ALTER TABLE "ProgramCard"
  ADD COLUMN "venueName" TEXT,
  ADD COLUMN "venueAddress" TEXT,
  ADD COLUMN "programDurationHours" INTEGER,
  ADD COLUMN "programDurationMinutes" INTEGER;
