# 2. Architecture and technology stack

## Chosen stack (and why)

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TypeScript** | One codebase for the website, PWA, parent area, child area and server logic |
| Styling | **Tailwind CSS v4** with design tokens in `src/app/globals.css` | Fast, consistent, themeable |
| Animation | **Framer Motion** | Smooth, accessible animations (`prefers-reduced-motion` respected) |
| Server logic | **Server Actions + Route Handlers** | No separate API to maintain for the MVP; REST endpoints can be added for mobile/schools later |
| Database | **PostgreSQL 16 + Prisma 6** | Relational integrity for learning records; JSON for flexible content bodies |
| Validation | **Zod** | Same schemas for forms, content files and tests |
| Auth | Own DB sessions (random token → SHA-256 in DB, httpOnly cookie) + bcrypt | Simple, revocable, no third-party data sharing for a children's product |
| Tests | **Vitest** (unit) + **Playwright** (end-to-end, desktop + tablet) | |
| Delivery | **Docker** (standalone output), GitHub Actions CI | Cloud-agnostic (any container host + managed Postgres) |

A separate Spring Boot service was considered and **not** chosen for the MVP: it doubles the stack without solving an MVP problem. If heavy analytics or school integrations need it later, it can sit behind the same Postgres or an event stream.

## High-level structure

```
┌──────────────────────── Browser (PWA) ────────────────────────┐
│ Landing · Parent area · Child universe · Activity player       │
│ (answers never sent to the browser; narration via Web Speech)  │
└───────────────▲───────────────────────────────┬────────────────┘
                │ HTML/RSC                       │ Server Actions
┌───────────────┴───────────────────────────────▼────────────────┐
│ Next.js server                                                  │
│  proxy.ts ── optimistic cookie check for /parent /play /admin   │
│  lib/auth/dal.ts ── the ONLY place a cookie becomes a user      │
│  app/actions/* ── auth, children, play, account, admin          │
│  lib/learning/* ── adaptive rules (pure) + progress queries     │
│  lib/content/* ── content contract, loader, answer checker      │
└───────────────▲─────────────────────────────────────────────────┘
                │ Prisma
┌───────────────┴──────────┐      ┌──────────────────────────────┐
│ PostgreSQL               │◄─────│ /content (JSON, in git)       │
│ users, children, content │ import│ objectives + activity packs  │
│ attempts, mastery, prices│      │ validated → IN_REVIEW → admin │
└──────────────────────────┘      └──────────────────────────────┘
```

## Folder map

```
content/               Educational content (data, not code)
  objectives/          Learning objectives, prerequisites, curriculum mappings
  activities/          Activity packs per subject × age group
docs/                  These documents
prisma/                schema.prisma, migrations, seed.ts
scripts/content.ts     content:validate / content:import CLI
src/
  app/                 Routes (landing, (auth), parent, play, admin, legal)
    actions/           Server Actions (all mutations)
  components/          UI kit, child components (player, visuals), parent components
  config/brand.ts      Product name, mascot, support email
  lib/
    auth/              password hashing, sessions, data-access layer
    content/           schema (contract), loader, answer checking
    learning/          adaptive rules, progress queries
    age.ts worlds.ts pricing.ts validation.ts achievements.ts
  proxy.ts             Route protection (Next 16 replacement for middleware)
tests/unit, tests/e2e
```

## Key design decisions

1. **Content is data.** Authors edit JSON in `/content`. `npm run content:import` validates it against the contract and upserts it. Changed activities get a new `version` and go back to `IN_REVIEW`. Only `PUBLISHED` activities reach children. No redeploy is needed for content.
2. **Answers stay on the server.** The player receives `publicItem()` (no answer, explanation or misconception map). `submitAnswer` checks on the server and returns feedback.
3. **Adaptive rules are pure functions** (`src/lib/learning/adaptive.ts`), shared by client (level stepping) and server (mastery), and fully unit-tested. Phase 5 can replace the scoring model without touching the UI.
4. **Child mode is a property of the session.** A parent "hands over" the device; the session gets `childMode=true`. Every parent route calls `requireParent()`, which redirects to the PIN screen in child mode.
5. **Authorisation in one place.** `dal.ts` exposes `requireParent`, `requireChild`, `requireRole`, and `getOwnedChild` (stops access to another family's child by ID).
6. **Prices, curricula and worlds are configurable**: `Price`, `Curriculum`/`CurriculumMapping` tables, `src/lib/worlds.ts`.

## Internationalisation plan

- `User.locale`, `Activity.locale` (unique per `slug + locale`) and `Curriculum` are already in the schema.
- Translated content is a new file with the same slug and a different `locale`; the importer handles it.
- UI strings: move to message dictionaries (`src/i18n/<locale>.ts`) in Phase 6. The MVP keeps English strings in components to avoid over-engineering.
- Number input accepts both `0.5` and `0,5` (Polish and European decimal comma).

## AI policy

AI is **not** used to generate answers in real time. Planned, limited uses (Phase 5):
- Drafting extra explanations and alternative wordings **for human review** before import.
- Choosing which existing reviewed explanation to show, based on the misconception.
- Any AI-shown text must come from a reviewed pool or pass a validation step against the item's known answer.

## Security notes

- bcrypt (cost 12) for passwords and PINs; sessions are random 256-bit tokens, stored hashed; httpOnly + SameSite=Lax + Secure in production.
- Login uses the same message and similar timing for unknown emails (no account enumeration).
- Open-redirect protection on `next` after login.
- Security headers in `next.config.ts` (nosniff, frame deny, referrer policy, permissions policy).
- To add before public launch: rate limiting on login/PIN (e.g. Redis or edge WAF), email verification, CSP with nonces.
