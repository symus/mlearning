# 4. Main user journeys

## A. Parent: discover → sign up → first child (working)

1. Landing page `/` → sees worlds, how activities work, safety promises, prices for their country (country selector).
2. **Start free** → `/signup`: name, email, password, 4-digit parent PIN, country, parental consent, terms. Server-side validation with clear messages; consent records are stored.
3. Redirect to `/parent/children/new`: nickname, birth year (age group shown live), daily goal, interests, narration.
4. Child page `/parent/children/[id]` confirms creation.

## B. Hand-over: parent → child (working)

1. Parent taps **Let a child play** → `/play/who` ("Who's exploring today?").
2. Tapping a profile switches the session to **child mode**.
3. First time: `/play/onboarding` — Muchi says hello (narrated), the child picks an explorer and a colour.
4. `/play` — the universe: greeting, **Next adventure** or **Quick review**, worlds, trophy shelf, today's goal ring.

## C. Child: learn an activity (working)

1. World `/play/world/math-galaxy` → zig-zag learning path with states (✨ new, 🌱 practising, ⭐ mastered, 🔁 review, 🔒 ask a grown-up) and a **Next!** marker.
2. Activity: **Learn** screen (explanation + visual model + example, read aloud) → **Let's practise!**
3. Each question: hints on request; first wrong answer → targeted help ("Not quite — have another go!" + remedy linked to the misconception); second wrong → explanation and the correct answer; correct → celebration + explanation.
4. Difficulty steps up or down between items. The round length depends on age (4 / 6 / 8 items).
5. **Summary**: score, effort-focused message, mastery, new achievements, follow-up activity. If today's goal is reached, the app suggests a break.

## C2. Child: Reading Journey (working)

1. Universe → **📖 Reading Journey** card (ages 3–8), or the banner in Reading Kingdom.
2. First visit: **Find my level** (placement check, up to 10 questions, stops early, no right/wrong feedback) or **Start at the beginning**.
3. Lesson map: 22 numbered stepping stones across 4 parts, with a dotted trail. ⭐ passed, green = already known (replayable), glowing = next lesson, 🔒 = coming up.
4. Passing a lesson (60%+) unlocks the next; the summary offers **Next: Lesson N** or **Back to my map**.
5. Parents see journey progress on the child page and can **Reset journey**.

## C3. Lesson experience (working)

1. **Intro:** Muchi greets the child by name, shows the lesson number, the learning objective ("Today you will learn…"), time and what to expect. Spoken if read-aloud is on.
2. **Resume:** an unfinished lesson from the last 24 hours offers "Continue (N done)" or "Start again".
3. **Song → explanation → practice** with hints, instant feedback, gentle sound effects and detailed explanations.
4. **Celebration:** confetti, 1–3 stars, Muchi cheer, badges, and a sticker gift box (fixed sticker per activity).
5. **Settings** in the child header: sound effects 🔔, read-aloud 🗣️, text size Aa (saved per child).
6. **Daily limit** (parent-set): warning 5 minutes before; then a friendly "see you tomorrow" screen. Unfinished lessons can still finish.

## C4. Maps and the activity library (working)

1. Every world and the Reading Journey are shown as **illustrated maps** (up to 10 lessons per map; the Reading Journey has one map per part). Numbered stepping stones on a dotted trail show 1–3 stars, 🎵 songs and 🔁 reviews. Muchi and the child's avatar stand at the current lesson. A treasure chest after the last lesson opens when every lesson on the map is done.
2. ◀ ▶ arrows move between maps (`?map=N`), 🏠 returns to the universe, 📚 opens the library. Phones get a portrait layout. A text lesson list sits under each map for screen readers.
3. **All activities** (`/play/activities`): every activity for the child's age on one page, filtered by world, progress and search (title, goal, topic).

## C5. QR login cards (working)

1. Parent → child's Progress page → **Login card** → *Make a login card* → print (only the card prints, on one page).
2. The child scans it with the tablet camera app, or with **📷 Scan my card** on the login page (`/login/qr`): a live camera on https/localhost, and a **📸 Take a photo of my card** button that works everywhere (including plain http on a home network). They land in their own play area.
3. Or the child types the **login ID and password** printed on the card (`/login/kids`, e.g. `aya4821` / `tiger0482`). Capitals and spaces are ignored. 5 wrong passwords in a row lock the card for 15 minutes.
4. Card sessions are **child-only**: no parent area, no PIN unlock, no switching to siblings, no data export. A grown-up must log in with email and password.
5. Making a new card cancels the old one (QR and password) and signs out devices that used it; the login ID stays the same. *Cancel card* does the same. Only hashes of the QR secret and password are stored, so they are shown once, when the card is made.

## D. Child → parent (working)

1. **Grown-ups** button → `/play/exit` PIN pad. A wrong PIN shows a friendly message.
2. Any attempt to open `/parent/*` in child mode redirects to the PIN screen.

## E. Parent: understand progress (working)

1. `/parent` — every child: minutes this week, activities, skills mastered, weekly goal bar, one plain-language "worth a look" item.
2. `/parent/children/[id]` — last 7 days, strengths, needs attention (with the recurring slip and a "try at home" tip), skills by subject with curriculum references, recent activity, achievements, edit, delete.

## E2. Weekly report (working)

`/parent/children/[id]/report?week=YYYY-MM-DD`: time (vs previous week), days active, activities, accuracy, minutes per day, subjects, what was learned, highlights, needs practice with "try at home" tips, stickers and achievements. Week navigation and print/PDF. Only the child's own parent can open it.

## F. Parent: account and privacy (working)

`/parent/settings` — account details, consent records, change PIN (password required), **download my data** (JSON), **delete account** (type DELETE + password). `/parent/plans` — current plan and local prices.

## G. Content reviewer (working)

`/admin` (ADMIN/REVIEWER only) → filter by status → `/admin/activity/[id]` full preview with answers, hints, wrong-answer maps, curriculum mapping, review checklist → **Approve & publish / Return to draft / Archive** (audited).

## T. Teacher (working, school pilot)

1. `/signup/teacher`: name, school, email, password, country, school authorisation + terms. Teachers get the **School (pilot)** plan: full library, no payment.
2. `/teacher`: create a class (name + age group, up to 10 classes).
3. `/teacher/classes/[id]` → **Students**: add first names (one per line or commas, up to 40 per class). No surnames, no real birth dates (the class's age group is used).
4. **Login cards**: *Make login cards for the class* → one card per student (QR + login ID + password), printed several to a page. Making cards again cancels the old ones. Students log in at `/login/kids` or by scanning; they get a child-only session (no teacher area).
5. **Assignments**: pick an activity for the class's age group (including its Reading Journey lessons) and an optional due date. Students see **🍎 From my teacher** first on their universe; the next unfinished one is their "Next adventure". Done = passed (60%+) since it was set; the teacher sees "N of M done" and who still needs to do it.
6. **Ranking (teacher only)**: last 7 days or all time, sorted by skills mastered, assignments done, activities, accuracy or minutes. Equal results share a place. Students never see rankings.
7. Teachers never reach the family area (`/parent` → `/teacher`); another teacher's class returns 404. Removing a student deletes their profile and records. `/teacher/settings`: data download and account deletion (deletes classes and students too).

## H. Later journeys (planned)

- Weekly email report (Phase 4), checkout and billing portal (Phase 4), family challenges (Phase 3/4), teacher class set-up (Phase 6).
