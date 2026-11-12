# 6. Content standard and authoring workflow

Content quality is the main competitive advantage. This document is the rulebook for authors and reviewers. The rules are also **enforced by code** in [`src/lib/content/schema.ts`](../src/lib/content/schema.ts).

## The 13 required parts of every activity

| # | Part | Where in the file |
|---|---|---|
| 1 | Age group | `ageBand` |
| 2 | Subject | `subject` |
| 3 | Topic and subtopic | `topic`, `subtopic` |
| 4 | Learning objective | `objective` (code in `content/objectives`) |
| 5 | Prerequisite knowledge | `prerequisites` on the objective |
| 6 | Short child-friendly explanation | `learn.text` (+ optional `visual`, `example`, `say`) |
| 7 | Interactive activity | `levels[].items[]` (`choice`, `number`, `order`) |
| 8 | Multiple difficulty levels | 2–4 `levels`, numbered 1..n |
| 9 | Hints | 1–3 `hints` per item, from gentle to specific |
| 10 | Correct answer + detailed explanation | `answer`, `explanation` |
| 11 | Common misconceptions | `misconceptions[]` (code, description, remedy) + per-item wrong-answer map |
| 12 | Mastery criteria | `mastery` (minAccuracy, minItems, atLevel) |
| 13 | Follow-up activity | `followUp` (must exist) |

Automatic checks: answers must be valid options; order answers must use every tile once; misconception codes must exist; follow-ups and prerequisites must exist; subject/age must match the objective; item IDs and path positions must be unique.

## Writing rules

- **Original only.** No text, questions or images copied from textbooks or other platforms.
- **One idea per item.** The prompt tests the objective, not reading stamina (unless reading is the objective).
- **Hints guide thinking**, never just give the answer. Hint 1 = strategy; hint 2 = a concrete step.
- **Wrong options are real mistakes.** Every distractor should correspond to a misconception children actually make.
- **Explanations show the method**, not just "the answer is 13".
- **Inclusive and international.** Varied names (Ola, Kai, Amara, Krish, Ines…), settings and foods; avoid culture-specific knowledge unless it is the objective.
- **Pre-readers:** every item for ages 3–5 needs a `say` line or a prompt simple enough to read aloud.
- **Units and number formats:** use metric; the checker accepts "0.5" and "0,5".

## Workflow

```
Author edits JSON in /content ──► npm run content:validate (CI also runs it)
        │
        ▼
npm run content:import ──► new or changed activities = IN_REVIEW (version + 1)
        │
        ▼
Reviewer opens /admin/activity/:id ──► checklist ──► Approve & publish (audited)
        │                                    └──► Return to draft
        ▼
Children see only PUBLISHED activities
```

The review checklist (shown in the admin screen): factual accuracy (independently checked), age-appropriateness and inclusivity, hint quality, real misconceptions with helpful remedies, accessibility (text alternatives, not colour-only), originality.

## Current library (end of this release)

- **37 objectives**, **37 activities**, **225 items**, all three age groups, maths and reading.
- Each age group × subject has 5–7 activities and at least one free activity.
- Curriculum references: England National Curriculum / EYFS (`uk-nc`).

Phase 2 target is **≥ 100 activities**. Next authoring batch: second activity per objective at a different angle (story context, visual-first, reasoning), plus measurement, time, money (maths) and spelling, poetry and non-fiction (reading).
