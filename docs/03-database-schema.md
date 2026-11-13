# 3. Database schema

Source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma). PostgreSQL 16.

## Entity overview

```
User (parent/admin) 1──* ChildProfile 1──* Attempt 1──* AttemptResponse
  │                        │
  │                        ├──* ObjectiveMastery *──1 Objective *──1 Subject
  │                        └──* ChildAchievement        │
  ├──* Session (activeChild?, childMode)                ├──* CurriculumMapping *──1 Curriculum
  ├──* ConsentRecord                                    └──* Activity (versioned, status)
  ├──1 Subscription
  └──* AuditLog                               Price (plan × country × interval)
```

## Tables

| Model | Purpose | Notable fields |
|---|---|---|
| `User` | Adult account (parent, reviewer, admin) | `email` (unique, lower-case), `passwordHash`, `parentPinHash`, `role`, `country`, `locale` |
| `Session` | Login session per device | `tokenHash` (SHA-256 of cookie), `childMode`, `activeChildId`, `expiresAt` |
| `ConsentRecord` | GDPR evidence of consent | `type` (TERMS, PRIVACY, PARENTAL_CONSENT), `version`, `grantedAt` |
| `AuditLog` | Security-relevant events | `action` (e.g. `child.deleted`, `content.publish`, `account.export`) |
| `ChildProfile` | A child under a parent | `nickname`, `birthYear` (no full DOB), `ageBand`, `curriculumCode`, `avatar` JSON, `interests[]`, `dailyGoalMinutes`, `narration` |
| `Curriculum` | Curriculum frameworks | `code` ("uk-nc", "intl"; later "pl-core", "in-ncert") |
| `Subject` | Maths, reading… | `world` (universe destination slug) |
| `Objective` | A learning objective | `code` (e.g. `MA.ADD.WITHIN20`), `topic`, `subtopic`, `prerequisites[]`, `masteryThreshold` |
| `CurriculumMapping` | Objective ↔ curriculum reference | unique (curriculum, objective) |
| `Activity` | A reviewed learning activity | `slug + locale` unique, `version`, `status` (DRAFT → IN_REVIEW → PUBLISHED → ARCHIVED), `pathOrder`, `isFree`, `body` JSON (explanation, levels, items, hints, misconceptions, mastery, follow-up), `contentHash`, `reviewedBy/At` |
| `Attempt` | One play-through of an activity | `startLevel`, `endLevel`, `correctCount`, `totalCount`, `hintsUsed`, `durationSec` |
| `AttemptResponse` | Every answer submitted | `itemId`, `level`, `answer` JSON, `isCorrect`, `hintsUsed`, `misconception`, `timeMs` |
| `ObjectiveMastery` | The child's model per objective | `score` (0–1), `status` (NOT_STARTED/LEARNING/PRACTISING/MASTERED), `bestLevel`, `reviewStep`, `nextReviewAt`, `misconceptions` JSON (code → count) |
| `ChildAchievement` | Earned achievements | unique (child, code) |
| `Price` | Price per plan, country/region, interval | `currency`, `amountMinor` (pence/grosze/paise) |
| `Subscription` | Plan state per parent | `plan`, `status`, `provider`, `providerCustomerId`, `currentPeriodEnd` |
| `ChildLoginCard` | A child's printable login card (QR code + simple password) | `tokenHash` (SHA-256 of the QR secret), `passwordHash` (bcrypt), `failedLogins`, `lockedUntil`, `revokedAt`. `ChildProfile.loginId` (e.g. `aya4821`) is made with the first card and never changes |

## Rules built into the schema

- **Data minimisation:** children have no email, full name, photo or full date of birth. Their only credential is the parent-made card (QR secret and a simple password), stored as hashes; it opens only the child's play area.
- **Right to erasure:** deleting a `User` or `ChildProfile` cascades to all learning records.
- **Content versioning:** re-importing changed content bumps `version` and clears review fields.
- **Attempt responses are append-only**; the last response per item is the final result. This keeps a full trail for later analysis (e.g. which misconception led to a correct second try).

## Migrations

`prisma/migrations/` is committed. Use `npm run db:migrate` in development and `npm run db:deploy` in production.
