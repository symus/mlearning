# Wondergrove

An adaptive learning universe for children aged 3–12. Maths and reading adventures built on carefully designed original content, with clear, honest progress for parents. No ads, no chat, no public profiles.

> "Wondergrove" is a working name. Change it in `src/config/brand.ts`.

## Documentation

| Doc | What it covers |
|---|---|
| [01 Product strategy](docs/01-product-strategy.md) | Vision, USP, differentiators, business model, school expansion |
| [02 Architecture](docs/02-architecture.md) | Stack, structure, key decisions, i18n, AI policy, security |
| [03 Database schema](docs/03-database-schema.md) | Entities and rules |
| [04 User journeys](docs/04-user-journeys.md) | Parent, child, reviewer flows |
| [05 Design system](docs/05-design-system.md) | Tokens, components, age-group interaction rules, accessibility |
| [06 Content standard](docs/06-content-standard.md) | The 13-part activity contract and review workflow |
| [07 Risks](docs/07-risks.md) | Educational, privacy, technical and business risks |
| [08 Roadmap & status](docs/08-roadmap-and-status.md) | Phases and next steps |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · PostgreSQL 16 · Prisma 6 · Zod · Vitest · Playwright · Docker

## Local setup

**Requirements:** Node.js 22+, PostgreSQL 16 (local install or Docker).

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Configure environment
cp .env.example .env          # edit DATABASE_URL if needed

# 3. Start PostgreSQL (skip if you already run one)
docker compose up -d db

# 4. Create the database tables
npm run db:migrate

# 5. Import content (auto-published for local dev) + demo family + prices
npm run db:seed

# 6. Run the app
npm run dev                   # http://localhost:3000
```

### Demo accounts (created by the seed)

| Who | Email | Password | Parent PIN |
|---|---|---|---|
| Parent with 2 children (Mia 7, Leo 4) and a week of history | `parent@example.com` | `Wonder-demo-2026` | `1234` |
| Content admin (opens `/admin`) | `admin@example.com` | `Wonder-admin-2026` | `1234` |

Try it: log in → **Let a child play** → pick Mia → play an activity → **Grown-ups** → PIN `1234` → open Mia's **Progress**.

## Environment variables

| Name | Required | Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | `postgresql://app:app@localhost:5432/wondergrove?schema=public` | PostgreSQL connection |
| `APP_URL` | no | `http://localhost:3000` | Public base URL (for future emails) |
| `SESSION_TTL_DAYS` | no | `30` | Session lifetime |
| `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` | no | | Demo parent created by the seed |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | no | | Admin created by the seed |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests (content contract, answer checking, adaptive engine, validation) |
| `npm run test:e2e` | Browser tests (desktop + tablet); builds must exist (`npm run build`) and the DB must be seeded |
| `npm run db:migrate` | Create/apply migrations (development) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Content + prices + demo data (safe to re-run) |
| `npm run db:reset` | Drop, re-migrate and re-seed the database |
| `npm run content:validate` | Check all content files against the contract |
| `npm run content:import` | Import content; new/changed activities go to **review** |

## Working with content

Content lives in `content/` as JSON, separate from the code:

```
content/objectives/objectives.json        objectives, prerequisites, curriculum mappings
content/activities/<subject>-<age>.json   activity packs
```

1. Edit or add an activity (see [the content standard](docs/06-content-standard.md)).
2. `npm run content:validate`
3. `npm run content:import` → it appears in `/admin` as **in review**.
4. A reviewer approves it in `/admin/activity/<id>` → children can see it. No redeploy needed.

## Testing

```bash
npm test                                   # 30 unit tests
npm run build && npm run test:e2e -- --trace off   # 4 e2e tests (2 journeys × desktop/tablet)
```

The end-to-end journey covers: landing → sign-up validation → sign-up → add child → hand-over → onboarding → child mode blocks the parent area → play a full activity → locked content shows "Ask a grown-up" → wrong and right PIN → the parent sees progress and "needs attention".

## Deployment

The app is a standard container (`output: "standalone"`).

```bash
docker build -t wondergrove .
docker run -p 3000:3000 -e DATABASE_URL=postgresql://... wondergrove
```

The container runs `prisma migrate deploy` on start, then the server. Run the seed or `content:import` once from a job or a one-off container. Full local stack: `docker compose up --build` (the app plus Postgres), then `docker compose run --rm seed`.

Production checklist: managed PostgreSQL in an EU region, HTTPS, `NODE_ENV=production` (secure cookies), backups, log retention policy, rate limiting at the edge/WAF, a legal review of the privacy notice and terms, and a DPIA.

CI (`.github/workflows/ci.yml`) runs content validation, lint, typecheck, unit tests, migrations, seed, build and e2e tests against a Postgres service.

## Project structure

See [Architecture → Folder map](docs/02-architecture.md#folder-map).
