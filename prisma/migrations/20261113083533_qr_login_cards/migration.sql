-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "childOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ChildLoginCard" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ChildLoginCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChildLoginCard_tokenHash_key" ON "ChildLoginCard"("tokenHash");

-- CreateIndex
CREATE INDEX "ChildLoginCard_childId_idx" ON "ChildLoginCard"("childId");

-- AddForeignKey
ALTER TABLE "ChildLoginCard" ADD CONSTRAINT "ChildLoginCard_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
