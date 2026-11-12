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

## Watch & Sing (optional opening step)

An activity can open with a `watch` block before the explanation:

| Kind | Fields | Rules |
|---|---|---|
| `song` | `title`, 2–12 `lines` (text + optional visual), `tune` (`bpm` 60–150, `instrument` xylophone/piano/marimba), `credit` | Original lyrics only. Each line ≤ 90 characters. An original pentatonic tune (melody + bass + soft beat) is generated in the browser; words light up on the beat. Echo mode (default): Pip says the line, then the child sings it to the music. |
| `video` | `title`, `src`, `captions` (.vtt, **required**), optional `poster`, `credit` | Self-hosted or CDN file. No YouTube embeds (tracking and ads). Captions are mandatory for accessibility. |

Nothing autoplays: the child presses play. Today 6 activities open with songs (counting, shapes, letter sounds, rhymes, bonds to 10, skip counting).
Browser speech can't say phonics sounds well, so professionally recorded songs and phonics videos are the next content upgrade.
To add one, put `video.mp4` and `video.vtt` in `public/media/` and reference them as `/media/video.mp4`.

## Lesson journeys (Reading Journey)

A journey is a numbered lesson map built from reviewed activities: `content/journeys/<slug>.json`.

| Field | Meaning |
|---|---|
| `stages[]` | Map regions (title, description, world art) with ordered lesson slugs. Lessons are numbered 1..n across stages. |
| `passAccuracy` | Accuracy needed in a lesson to unlock the next (0.6 for reading). |
| `placement.tiers[]` | Harder and harder question sets. A tier passes only if every item is right; the first failed tier sets `startIfFailed`. |
| `placement.allPassStart` | Start lesson if every tier passes. |

The Reading Journey (ages 3–8) has 22 lessons in 4 parts: Sound Seeds (1–6, free), Letter Garden (7–13), Word Builders (14–17), Story Readers (18–22).
The phonics order follows widely used systematic synthetic phonics practice: s a t p → i n m d → g o c k → ck e u r → h b f l → j v w x → y z qu → tricky words → digraphs → vowel teams.
Placement items are never shown with right/wrong feedback, and the check stops at the first tier that is too hard.

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

- **46 objectives**, **47 activities**, **285 items**, **8 songs**, **1 lesson journey (22 lessons)**, all three age groups, maths and reading.
- Each age group × subject has 5–7 activities and at least one free activity.
- Curriculum references: England National Curriculum / EYFS (`uk-nc`).

Phase 2 target is **≥ 100 activities**. Next authoring batch: second activity per objective at a different angle (story context, visual-first, reasoning), plus measurement, time, money (maths) and spelling, poetry and non-fiction (reading).
