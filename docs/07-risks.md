# 7. Major risks and mitigations

## Educational

| Risk | Impact | Mitigation |
|---|---|---|
| Content errors reach children | Trust loss, harm to learning | Code-enforced contract, human review gate, versioning, audit log; add a second reviewer for maths answers before launch |
| Too little content for paying families | Churn | Content production plan (≥100 by Phase 2 end, ~300 by Phase 5); measure completion per world |
| Adaptivity misjudges a child (too easy/hard) | Boredom or frustration | Conservative rule-based steps, transparent mastery criteria; Phase 5 calibrates with real data |
| Gamification overshadows learning | Shallow engagement | Rewards only for effort/persistence/mastery; no currency, no loot, no streak penalties |
| Narration quality varies by device (Web Speech) | Poor experience for pre-readers | Phase 3: recorded human audio for ages 3–5 (especially phonics sounds, which TTS often says as letter names) |

## Privacy and safety

| Risk | Mitigation |
|---|---|
| Processing children's data (GDPR Art. 8, UK Children's Code, Polish UODO guidance, India DPDP Act) | Parent-only accounts, consent records, data minimisation, export and delete; **legal review and a DPIA before public launch** |
| Child reaches settings/billing | Parent PIN gate on every parent route in child mode |
| Account takeover | bcrypt, hashed session tokens, httpOnly cookies; **add rate limiting, email verification and 2FA option before launch** |
| Third-party trackers | None installed. Any analytics must be first-party, privacy-preserving, and off for child screens |
| Hosting location | Host EU data in an EU region; review India data-localisation rules before launch there |

## Technical

| Risk | Mitigation |
|---|---|
| Next.js 16 is new (proxy, caching changes) | Stayed on the stable dynamic rendering model; e2e tests cover main flows |
| JSON content bodies drift from the schema | Contract validated on import and in CI; body typed via `ActivityBody` |
| Scale of attempt data | Indexed by child + date; partition `AttemptResponse` by month when large; move analytics to a warehouse |
| Offline/PWA expectations | Manifest done; service worker and offline packs planned in Phase 4 with selected activities |

## Business

| Risk | Mitigation |
|---|---|
| Strong incumbents | Compete on content quality, misconception insight and trust, not volume |
| Price sensitivity across markets (PL, IN) | Per-country `Price` table; Family plan value |
| Payment compliance (SCA/PSD2, VAT/GST) | Use Stripe Checkout + Stripe Tax in Phase 4; no card data on our servers |
| Claims regulation (advertising standards) | No grade or IQ claims; outcome language limited to measured mastery |
