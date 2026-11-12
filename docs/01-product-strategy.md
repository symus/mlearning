# 1. Product strategy

> Product name: **Arivupulla** (Tamil அறிவுப்புள்ள, "child of knowledge"). Change it in `src/config/brand.ts`. Guide character: **Muchi**, an original star-sprout character.

## Vision

A learning universe for children aged 3–12 that children *want* to open, parents *trust*, and families consider *worth paying for* — because they can see real learning, not just screen time.

## Unique selling proposition

**"Every activity is designed like a lesson, and every mistake teaches us something."**

Most platforms show a child a question and a score. Arivupulla links each answer to a learning objective and each wrong answer to a known misconception. That lets us:

1. Help the child with feedback that fits *why* they went wrong (e.g. "count the jumps, not the number you start on").
2. Show parents *what* their child understands and *what* trips them up, in plain language.
3. Bring skills back at the right time (spaced review) instead of repeating what is already known.

## Strongest competitive differentiators

| # | Differentiator | How the product delivers it | Why it is hard to copy |
|---|---|---|---|
| 1 | **Content quality** | A strict 13-part content contract checked by code (`src/lib/content/schema.ts`), plus human review before publishing | Takes curriculum expertise and editorial process, not just engineering |
| 2 | **Misconception-aware adaptivity** | Wrong answers map to misconception codes; difficulty steps up and down; spaced review | Needs a content model built for it from day one |
| 3 | **Honest parent insight** | Progress by objective, recurring slips with "try at home" tips, no IQ or diagnosis claims | Builds trust; supports premium pricing |
| 4 | **Healthy engagement** | Effort-based achievements, daily goals with natural stopping points, no streak pressure, no ads | A brand promise competitors with ad or dark-pattern models can't match |
| 5 | **International by design** | Curriculum mapping table, per-country pricing table, locale on content, comma-decimal answers accepted | Opens Poland/EU/India/UK from one codebase |
| 6 | **Explorable universe** | Worlds, paths, avatar, trophy shelf instead of a lesson list | Strong identity and emotional pull for children |

## Target markets (first)

UK, Poland, wider EU, India, other English-speaking markets. English first; the architecture supports more languages (see Architecture → i18n).

## Business model

| Plan | Who | Includes |
|---|---|---|
| Free | Everyone at sign-up | Starter activities in each open world (`isFree`), 1 child, 3 activities/day, basic progress |
| Premium | 1 child | Whole library, adaptivity, full progress, recommendations, offline selection |
| Family | Up to 4 children | Everything in Premium + per-child paths, weekly reports, family challenges |

- Prices live in the `Price` table by plan × country × interval, so they change without a deploy. Seeded examples: GBP 7.99 / 11.99 a month, PLN 34.99 / 49.99, INR 399 / 599.
- **No fake discounts, no countdowns, no "was" prices.** The yearly price is shown as a plain alternative.
- Children never see prices; locked items say "Ask a grown-up".

### Future revenue lines (Phase 6+)

Schools and teacher subscriptions (class management, assignments, class reports), printable worksheets generated from the same content, live expert-led workshops, curriculum-specific packs (e.g. Polish core curriculum, CBSE).

## Expansion roadmap to schools

1. **Teacher accounts** reuse the content and mastery engine; add `School`, `Class`, `Enrolment` models.
2. **Class insights**: misconception heat-map per class (the data already exists per child).
3. **Assignments**: teacher picks objectives; the adaptive engine does the rest.
4. **District/MAT licensing** with SSO (Google Workspace for Education, Microsoft 365).
5. **Data-processing agreements** and school-specific privacy terms (schools act as data controllers).

## What we will not claim

We never claim to measure intelligence, diagnose learning difficulties, or guarantee grades. Reports describe practice and mastery of specific objectives only.
