-- CreateTable
CREATE TABLE "Journey" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "JourneyProgress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "journeySlug" TEXT NOT NULL,
    "startLesson" INTEGER NOT NULL DEFAULT 1,
    "completed" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "placedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JourneyProgress_childId_journeySlug_key" ON "JourneyProgress"("childId", "journeySlug");

-- AddForeignKey
ALTER TABLE "JourneyProgress" ADD CONSTRAINT "JourneyProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyProgress" ADD CONSTRAINT "JourneyProgress_journeySlug_fkey" FOREIGN KEY ("journeySlug") REFERENCES "Journey"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
