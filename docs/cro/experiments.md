# CRO experiments (issue #30)

Experiments are declared in `src/domains/experiments/config.ts`. They are
**prepared, not running** — each has `enabled: false` and no page reads its
variant yet. Turning one on is a code change + deploy, so a live test is always
deliberate.

## Mechanism

1. `getVariant(key)` (server) assigns a sticky variant per visitor via the
   `pv_exp` cookie (90 days). Control is returned while `enabled` is false.
2. `ExperimentTracker` (client, in the root layout) sends every active variant to
   GA4 as a `user_property` (`exp_<key>`), so funnels can be segmented.
3. Conversion is already event-tracked per step (`begin_checkout`,
   `payment_started`, `reservation_confirmed`) with `property_slug` — cross with
   `exp_<key>` in GA4 Explorations.

## Prepared experiments

| Key | Hypothesis | Variants (control first) | To activate |
|---|---|---|---|
| `hero_layout` | A direct date search in the hero converts better than destination cards | `control_cards`, `hero_search` | set `enabled: true`; branch in `HomeView` on `getVariant("hero_layout")` |
| `availability_cta` | "Consultar fechas" lowers friction vs "Ver disponibilidad" | `ver_disponibilidad`, `consultar_fechas` | set `enabled: true`; use the variant for the primary CTA label site-wide |
| `price_position` | Total price + reviews above the fold on the property page improves conversion | `price_below`, `price_above` | set `enabled: true`; reorder the property page sections on the variant |

## Running one

1. Implement the variant branch in the relevant view, reading `getVariant(key)`.
2. Flip `enabled: true`, deploy.
3. Let it run to a pre-decided sample size (do not peek-and-stop).
4. Compare `reservation_confirmed` rate by `exp_<key>` in GA4, segmented by
   `property_slug`.
5. Ship the winner as the new default; set `enabled: false` and remove the losing
   branch.

**No false urgency, fake counters or manipulative copy** — issue #30 rules out
those regardless of experiment outcome.
