# Token ledger — Praetoria Vacacional

One row per working session. Estimated where the environment does not expose exact usage.

| Date | Session | Model | Approx tokens | Output |
|---|---|---|---|---|
| 2026-08-27 | S1 — build spine + S1–S4 done, S5–S17 scaffolded | claude-sonnet-5 | ~330k context | 68 files, 3 commits, full DEMO E2E verified |
| 2026-08-27 | S5–S21 push: gallery, guides, CSP, a11y, i18n ES/EN incl. checkout, price editor, experiments | claude-sonnet-5 | long session | +10 commits (13 total), 34 unit + 11 e2e green, EN funnel live |

_AI-time note: this session ≈ a full AI working day plus the supervision already
given (the four setup answers). A traditional team would measure the same output
in weeks — that comparison is not the unit used here._
| 2026-08-27 | V2 batch (#34-#41): config-status, real Booking content+photos, home/cards/booking-module redesign, SEO corrected, polish. Released V1+V2 to main. | claude-sonnet-5 | long session | 34 unit + 14 e2e green; ~28 commits total |
| 2026-08-27 | #42 production-ready: /api/health, error boundaries, email log + payments admin view, internal notification, iCal admin form, launch checklist. Merged to main. | claude-sonnet-5 | session | 34 unit + 18 e2e green; ~32 commits |
| 2026-08-28 | #53 brand repositioning: Valencia → playa de la Llastra (copy only, D-008), Javalambre ~20→~10 min everywhere, "Del Mediterráneo a la nieve, desde Valencia", ES+EN. Committed to develop + merged to main. | claude-sonnet-5 | session | 19 files, 1 commit; 56 unit + 64 chromium e2e green; issue #53 commented |
| 2026-08-28 | #54 activate promo code 10PRAETORIA10 (10% off both properties): DB migration + DEMO seed via new `PRAETORIA10_COUPON` constant + forward-compat upsert. Committed to develop + merged to main. | claude-sonnet-5 | short session | 6 files, 1 commit; 61 unit + 65 chromium e2e green; issue #54 commented |
| 2026-08-28 | #55 fix property-page availability CTAs jumping to top: duplicate `id="contenido"` (aside vs `<main>`) → per-property `#reserva-<slug>` anchor via new `domains/booking/anchor.ts`; subtle `:target` ring. Committed to develop + merged to main. | claude-sonnet-5 | short session | 5 files, 1 commit; 64 unit + 70 chromium e2e green; issue #55 commented |
| 2026-08-28 | Polish (no issue): removed compounding FAQ→footer whitespace on the home (FaqBlock/main/footer spacing); added 2 new general FAQs ES+EN. Browser-verified desktop; e2e locks the gap. Committed to develop + merged to main. | claude-sonnet-5 | short session | 5 files, 1 commit; 64 unit + 73 chromium e2e green |
