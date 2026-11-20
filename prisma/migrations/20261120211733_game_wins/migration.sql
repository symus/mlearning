-- CreateTable
CREATE TABLE "GameWin" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "deck" TEXT NOT NULL,
    "tie" BOOLEAN NOT NULL DEFAULT false,
    "wonAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameWin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameWin_classroomId_wonAt_idx" ON "GameWin"("classroomId", "wonAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameWin_gameId_childId_key" ON "GameWin"("gameId", "childId");

-- AddForeignKey
ALTER TABLE "GameWin" ADD CONSTRAINT "GameWin_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWin" ADD CONSTRAINT "GameWin_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

