# 8. Roadmap and status

## MVP scope (Phases 1–2)

**In:** landing page, parent sign-up/login, consent, child profiles, age-based onboarding, child universe and world paths, activity engine (3 item types, 12 visual models, hints, misconception feedback, adaptive levels), mastery and spaced review, parent progress, data export/delete, content import and review, plan display.

**Out (later phases):** payments, weekly email, science/coding/logic worlds, teacher accounts, additional UI languages, recorded audio, offline packs.

## Phases

| Phase | Goal | Status |
|---|---|---|
| 1. Foundation | Architecture, design system, landing, registration, child profiles, onboarding, dashboard | ✅ **Done** |
| 2. Educational MVP | Maths + reading, exercise engine, hints, explanations, progress, ≥100 activities | 🟡 **Engine done; 37 of 100 activities** |
| 3. Engagement | Illustrated universe, avatar room, missions, more achievements, progress map, family challenges | 🟡 Illustrated universe, drawn avatars, Watch & Sing songs, trophy shelf done |
| 4. Parent premium | Weekly reports (email), Stripe subscriptions, billing portal, plan limits, offline selected activities | ⏳ Charts on dashboard; plans + prices + limits modelled |
| 5. Intelligence | Calibrated mastery model, personalised paths across objectives, AI-assisted explanations with validation | ⏳ Rule-based adaptivity + spaced review done |
| 6. Expansion | Science, coding, logic, geography, money worlds; Polish UI; school and teacher accounts | ⏳ Worlds and curriculum tables ready |

## Next implementation steps (in order)

1. **Author 63+ more activities** to reach 100 (second activity per objective + new topics). Pure content work: no code changes needed.
2. Professionally recorded phonics sounds and rhyme videos (the `watch.video` format is ready); dyslexia-friendly font toggle.
3. Login/PIN rate limiting and email verification.
4. Phase 3: avatar room (unlockable items for effort), missions spanning several activities, family challenges.
5. Phase 4: Stripe Checkout + webhooks → `Subscription`; weekly report job + email.
