# 5. Design system

Tokens live in [`src/app/globals.css`](../src/app/globals.css) (`@theme`) and are used as Tailwind classes (`bg-brand`, `text-ink-soft`, …).

## Two moods, one system

| | Parent area | Child area |
|---|---|---|
| Feeling | Calm, trustworthy, clear | Playful, magical, encouraging |
| Background | `paper` (#FFFBF3 warm cream) | `.bg-universe` (deep violet starfield made from CSS gradients) |
| Surfaces | White cards, 1px `line` border, soft shadow | Big rounded cards (`rounded-[2rem]`), world colours |
| Buttons | Pill buttons, 44px+ tall | `btn-pop` buttons with a 3D press, 56–96px tall |
| Type size | 16px body | 18–30px; prompts up to 36px for ages 3–5 |

## Colour

| Token | Hex | Use |
|---|---|---|
| `ink` / `ink-soft` / `ink-muted` | #1E1B3A / #4B4768 / #6F6B8A | Text (all pass WCAG AA on paper/white) |
| `paper`, `surface`, `line` | #FFFBF3, #FFFFFF, #EBE5D8 | Backgrounds and borders |
| `brand` | #5B3FD9 | Primary actions, links, focus ring |
| `sun` | #FFC23D | Highlights, "next", hints |
| `leaf` | #23A565 | Success, mastery, "Let's practise" |
| `coral` | #FF7A59 | Gentle "not quite" (never harsh red for children) |
| `sky` | #2F8FEF | Narration, information |
| `berry`, `sand` | #C8458E, #D7B072 | Visual models, passages |
| `danger` | #C8323C | Destructive parent actions only |
| World colours | nebula #5B3FD9, grove #1F9D6B, lab #0E8FA0, peaks #D9652A, harbour #2F6FE0, atlas #A86C12, studio #C8458E, cove #B08700 | One identity colour per world |

## Typography

- **Display:** Fredoka (rounded, friendly) for headings and numbers.
- **Body:** Nunito (very legible, rounded terminals, Latin Extended for Polish characters).
- Loaded with `next/font` (self-hosted at build time, no runtime calls to Google).

## Components

| Component | File |
|---|---|
| Button / ButtonLink (primary, secondary, ghost, danger, sun; sm/md/lg) | `components/ui/button.tsx` |
| Card, Badge, ProgressBar | `components/ui/card.tsx` |
| TextField, SelectField, CheckboxField, FieldError, FormMessage | `components/ui/field.tsx` |
| Muchi mascot (happy / think / cheer) | `components/mascot.tsx` |
| Avatar (character + colour) | `components/avatar.tsx` |
| Visual models: objects, groups, ten frame, number line, array, fraction bar, shapes, place value, passage, big text, pattern, grid | `components/child/visual.tsx` |
| Activity player (learn → items → feedback → summary) | `components/child/player.tsx` |

## Interaction rules per age group

| | Little Explorers 3–5 | Young Thinkers 6–8 | Future Innovators 9–12 |
|---|---|---|---|
| Instructions | Auto-narrated, picture-led | Text + optional narration | Text-first |
| Answer input | Huge picture buttons, one tap | Buttons, keypad, ordering | Keypad, ordering, longer text options |
| Items per round | 4 | 6 | 8 |
| Suggested session | ~10 min | ~20 min | ~30 min |

## Accessibility

- Visible focus ring (`:focus-visible`, 3px brand outline) everywhere.
- Every visual model has a text alternative (`role="img"` + `aria-label`).
- Feedback announced with `aria-live`; form errors linked with `aria-describedby`.
- Never colour alone: states use icons + words (⭐ Mastered, 🔒 Ask a grown-up).
- `prefers-reduced-motion` disables animations.
- Touch targets ≥ 44px (parent) and ≥ 56px (child).
- Planned: dyslexia-friendly font toggle, high-contrast mode, full keyboard testing with screen readers.

## Illustration and sound

All key art is original SVG drawn in code (no external assets, works offline, scales to any size):

| Art | File |
|---|---|
| Muchi, the guide | `components/mascot.tsx` |
| 6 avatar characters × 6 colours (fox, owl, bear, cat, dragon, robot) | `components/art/characters.tsx` |
| 8 world islands, one landmark each | `components/art/worlds.tsx` |

Shared style: round shapes, dot eyes with a white highlight, rosy cheeks, soft shadow under floating islands, gentle `animate-float`.
System emoji are still used for small objects inside questions (apples, stars). A commissioned illustration set and optional sound effects come later.
