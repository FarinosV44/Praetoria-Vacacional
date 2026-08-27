# Mobile-first responsive audit (issue #52)

_Run: 2026-08-27. Method: Chromium device emulation at 320 / 360 / 375 / 390 /
414 / 768 / 1024 / 1280 px + DOM measurement in `e2e/mobile.spec.ts`._

## What was checked and fixed

| Area | Finding | Fix |
|---|---|---|
| Header | On < 768 px the nav was `hidden` with no replacement — mobile users could not reach property or guide pages from the header. The right-hand cluster (`shrink-0`) + full logo + CTA overflowed the viewport by ~53 px at every mobile width. | New `MobileMenu` client component: hamburger → one clean panel with both properties, Guías, Contacto and a full-width "Ver disponibilidad" CTA. Logo now `min-w-0 truncate`; desktop CTA is `hidden md:inline-flex` (the panel carries it on mobile). Scroll lock + close-on-route-change + backdrop. |
| Language switcher | 36 × 28 px tap target. | `h-10`, wider padding — now 40 px. |
| Footer | Link rows were ~17 px tall with 8 px gaps — a cramped "wall of links". | Each link `block py-1.5` → ~32 px rows with a full-width hit area. |
| Coupon toggle (checkout) | 20 px text link. | `min-h-[40px] inline-flex items-center`. |
| Horizontal overflow | — | **0 px** on home, property, landing, guide hub, guide and checkout at all six mobile widths (asserted). |
| Persistent booking CTA | — | Sticky bottom bar on home/property is 48 px, present without covering content (`pb-16` on `<main>`). Verified ≥ 44 px at 375 px. |
| Images | `next/image` with responsive `sizes`; hero uses `fill` inside positioned parents. No desktop-only images shipped to mobile. | No change needed. |
| Booking module | Inputs are `h-11`/`h-12`, native date inputs, guest `<select>`; stacks to one column < 1024 px; selected dates persist via URL params. | No change needed. |
| Guides / SEO content | `max-w-2xl` reading column, TOC hidden < lg, tables in the distances block are `w-full` with `whitespace-nowrap` only on the value cell. | No change needed. |

## Automated guardrail

`e2e/mobile.spec.ts` (chromium): 36 no-overflow assertions (6 pages × 6 widths)
+ touch-target + mobile-menu behaviour. Runs in the standard suite.

## Known limitation

Playwright's bundled WebKit in this environment does not apply the Tailwind v4
stylesheet (every element computes to unstyled defaults), so the `mobile-safari`
project cannot verify layout here and those specs are skipped on WebKit. Real
iOS/macOS Safari 16.4+ fully supports the CSS used (cascade layers, `@property`,
`oklch`). **Manual pass on a real iPhone (Safari) at 375 px and 390 px through
home → property → dates → coupon → checkout → confirmation is the one remaining
mobile check** and is listed in `docs/launch-checklist.md`.
