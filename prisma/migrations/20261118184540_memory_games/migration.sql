-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('INVITED', 'PLAYING', 'FINISHED', 'ENDED');

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "gamesEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "MemoryGame" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "playerAId" TEXT NOT NULL,
    "playerBId" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'INVITED',
    "deck" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "endedReason" TEXT,
    "endedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryGame_playerAId_status_idx" ON "MemoryGame"("playerAId", "status");

-- CreateIndex
CREATE INDEX "MemoryGame_playerBId_status_idx" ON "MemoryGame"("playerBId", "status");

-- CreateIndex
CREATE INDEX "MemoryGame_updatedAt_idx" ON "MemoryGame"("updatedAt");

-- AddForeignKey
ALTER TABLE "MemoryGame" ADD CONSTRAINT "MemoryGame_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryGame" ADD CONSTRAINT "MemoryGame_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryGame" ADD CONSTRAINT "MemoryGame_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

