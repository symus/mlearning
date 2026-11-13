-- AlterTable
ALTER TABLE "ChildLoginCard" ADD COLUMN     "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "loginId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_loginId_key" ON "ChildProfile"("loginId");

