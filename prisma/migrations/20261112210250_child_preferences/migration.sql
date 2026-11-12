-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "dailyLimitMinutes" INTEGER,
ADD COLUMN     "soundEffects" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "textSize" TEXT NOT NULL DEFAULT 'normal';
