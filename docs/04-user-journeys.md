# 4. Main user journeys

## A. Parent: discover → sign up → first child (working)

1. Landing page `/` → sees worlds, how activities work, safety promises, prices for their country (country selector).
2. **Start free** → `/signup`: name, email, password, 4-digit parent PIN, country, parental consent, terms. Server-side validation with clear messages; consent records are stored.
3. Redirect to `/parent/children/new`: nickname, birth year (age group shown live), daily goal, interests, narration.
4. Child page `/parent/children/[id]` confirms creation.

## B. Hand-over: parent → child (working)

1. Parent taps **Let a child play** → `/play/who` ("Who's exploring today?").
2. Tapping a profile switches the session to **child mode**.
3. First time: `/play/onboarding` — Pip says hello (narrated), the child picks an explorer and a colour.
4. `/play` — the universe: greeting, **Next adventure** or **Quick review**, worlds, trophy shelf, today's goal ring.

## C. Child: learn an activity (working)

1. World `/play/world/number-nebula` → zig-zag learning path with states (✨ new, 🌱 practising, ⭐ mastered, 🔁 review, 🔒 ask a grown-up) and a **Next!** marker.
2. Activity: **Learn** screen (explanation + visual model + example, read aloud) → **Let's practise!**
3. Each question: hints on request; first wrong answer → targeted help ("Not quite — have another go!" + remedy linked to the misconception); second wrong → explanation and the correct answer; correct → celebration + explanation.
4. Difficulty steps up or down between items. The round length depends on age (4 / 6 / 8 items).
5. **Summary**: score, effort-focused message, mastery, new achievements, follow-up activity. If today's goal is reached, the app suggests a break.

## C2. Child: Reading Journey (working)

1. Universe → **📖 Reading Journey** card (ages 3–8), or the banner in Story Grove.
2. First visit: **Find my level** (placement check, up to 10 questions, stops early, no right/wrong feedback) or **Start at the beginning**.
3. Lesson map: 22 numbered stepping stones across 4 parts, with a dotted trail. ⭐ passed, green = already known (replayable), glowing = next lesson, 🔒 = coming up.
4. Passing a lesson (60%+) unlocks the next; the summary offers **Next: Lesson N** or **Back to my map**.
5. Parents see journey progress on the child page and can **Reset journey**.

## D. Child → parent (working)

1. **Grown-ups** button → `/play/exit` PIN pad. A wrong PIN shows a friendly message.
2. Any attempt to open `/parent/*` in child mode redirects to the PIN screen.

## E. Parent: understand progress (working)

1. `/parent` — every child: minutes this week, activities, skills mastered, weekly goal bar, one plain-language "worth a look" item.
2. `/parent/children/[id]` — last 7 days, strengths, needs attention (with the recurring slip and a "try at home" tip), skills by subject with curriculum references, recent activity, achievements, edit, delete.

## F. Parent: account and privacy (working)

`/parent/settings` — account details, consent records, change PIN (password required), **download my data** (JSON), **delete account** (type DELETE + password). `/parent/plans` — current plan and local prices.

## G. Content reviewer (working)

`/admin` (ADMIN/REVIEWER only) → filter by status → `/admin/activity/[id]` full preview with answers, hints, wrong-answer maps, curriculum mapping, review checklist → **Approve & publish / Return to draft / Archive** (audited).

## H. Later journeys (planned)

- Weekly email report (Phase 4), checkout and billing portal (Phase 4), family challenges (Phase 3/4), teacher class set-up (Phase 6).
