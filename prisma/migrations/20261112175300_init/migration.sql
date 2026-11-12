-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TERMS', 'PRIVACY', 'PARENTAL_CONSENT');

-- CreateEnum
CREATE TYPE "AgeBand" AS ENUM ('LITTLE_EXPLORERS', 'YOUNG_THINKERS', 'FUTURE_INNOVATORS');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MasteryStatus" AS ENUM ('NOT_STARTED', 'LEARNING', 'PRACTISING', 'MASTERED');

-- CreateEnum
CREATE TYPE "PlanCode" AS ENUM ('FREE', 'PREMIUM', 'FAMILY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "country" TEXT NOT NULL DEFAULT 'GB',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "parentPinHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeChildId" TEXT,
    "childMode" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "version" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "ageBand" "AgeBand" NOT NULL,
    "curriculumCode" TEXT NOT NULL DEFAULT 'uk-nc',
    "avatar" JSONB NOT NULL,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 15,
    "narration" BOOLEAN NOT NULL DEFAULT true,
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Subject" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "world" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Objective" (
    "code" TEXT NOT NULL,
    "subjectSlug" TEXT NOT NULL,
    "ageBand" "AgeBand" NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "childTitle" TEXT NOT NULL,
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "masteryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "CurriculumMapping" (
    "id" TEXT NOT NULL,
    "curriculumCode" TEXT NOT NULL,
    "objectiveCode" TEXT NOT NULL,
    "reference" TEXT NOT NULL,

    CONSTRAINT "CurriculumMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "ageBand" "AgeBand" NOT NULL,
    "subjectSlug" TEXT NOT NULL,
    "objectiveCode" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pathOrder" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 5,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "body" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "startLevel" INTEGER NOT NULL,
    "endLevel" INTEGER,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "misconception" TEXT,
    "timeMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectiveMastery" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "objectiveCode" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MasteryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "itemsSeen" INTEGER NOT NULL DEFAULT 0,
    "itemsCorrect" INTEGER NOT NULL DEFAULT 0,
    "bestLevel" INTEGER NOT NULL DEFAULT 0,
    "reviewStep" INTEGER NOT NULL DEFAULT 0,
    "lastPracticed" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "misconceptions" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ObjectiveMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildAchievement" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "plan" "PlanCode" NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "interval" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanCode" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" TEXT,
    "providerCustomerId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "ChildProfile_parentId_idx" ON "ChildProfile"("parentId");

-- CreateIndex
CREATE INDEX "Objective_subjectSlug_ageBand_idx" ON "Objective"("subjectSlug", "ageBand");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumMapping_curriculumCode_objectiveCode_key" ON "CurriculumMapping"("curriculumCode", "objectiveCode");

-- CreateIndex
CREATE INDEX "Activity_subjectSlug_ageBand_status_idx" ON "Activity"("subjectSlug", "ageBand", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_locale_key" ON "Activity"("slug", "locale");

-- CreateIndex
CREATE INDEX "Attempt_childId_startedAt_idx" ON "Attempt"("childId", "startedAt");

-- CreateIndex
CREATE INDEX "AttemptResponse_attemptId_idx" ON "AttemptResponse"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "ObjectiveMastery_childId_objectiveCode_key" ON "ObjectiveMastery"("childId", "objectiveCode");

-- CreateIndex
CREATE UNIQUE INDEX "ChildAchievement_childId_code_key" ON "ChildAchievement"("childId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Price_plan_country_interval_key" ON "Price"("plan", "country", "interval");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_activeChildId_fkey" FOREIGN KEY ("activeChildId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_subjectSlug_fkey" FOREIGN KEY ("subjectSlug") REFERENCES "Subject"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumMapping" ADD CONSTRAINT "CurriculumMapping_curriculumCode_fkey" FOREIGN KEY ("curriculumCode") REFERENCES "Curriculum"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumMapping" ADD CONSTRAINT "CurriculumMapping_objectiveCode_fkey" FOREIGN KEY ("objectiveCode") REFERENCES "Objective"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_subjectSlug_fkey" FOREIGN KEY ("subjectSlug") REFERENCES "Subject"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_objectiveCode_fkey" FOREIGN KEY ("objectiveCode") REFERENCES "Objective"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptResponse" ADD CONSTRAINT "AttemptResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveMastery" ADD CONSTRAINT "ObjectiveMastery_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveMastery" ADD CONSTRAINT "ObjectiveMastery_objectiveCode_fkey" FOREIGN KEY ("objectiveCode") REFERENCES "Objective"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAchievement" ADD CONSTRAINT "ChildAchievement_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
