-- CreateTable
CREATE TABLE "ChildSticker" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activitySlug" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildSticker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChildSticker_childId_activitySlug_key" ON "ChildSticker"("childId", "activitySlug");

-- AddForeignKey
ALTER TABLE "ChildSticker" ADD CONSTRAINT "ChildSticker_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
