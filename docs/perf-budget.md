# Performance budgets & Core Web Vitals (issue #78)

`lighthouserc.json` at the repo root defines the budgets; the **Lighthouse CI**
job in `.github/workflows/ci.yml` runs them on every push/PR.

## What is enforced

Runs a production build + `next start` and audits 5 representative URLs (home,
both property pages, a seasonal offer, a guide hub), 3 runs each, median.

| Metric | Threshold | Level |
|---|---|---|
| Accessibility | ≥ 0.95 | **error** (fails CI) |
| SEO | ≥ 0.95 | **error** |
| Cumulative Layout Shift | ≤ 0.10 | **error** |
| Performance | ≥ 0.85 | warn |
| Best Practices | ≥ 0.90 | warn |
| FCP / LCP | ≤ 2.0s / ≤ 2.8s | warn |
| Total Blocking Time | ≤ 350ms | warn |
| Script bytes | ≤ 320 KB | warn |
| Image bytes | ≤ 900 KB | warn |
| Unused JS | ≤ 160 KB | warn |

`warn` assertions annotate the run without failing it — CI-run Lighthouse is
noisy on a shared runner, so only the stable, high-signal checks are hard gates.
Reports upload to `temporary-public-storage` (link in the job log).

## Real-world CWV (the deployed site)

CI numbers are a lab proxy. For field data:

1. **Search Console → Core Web Vitals** once the sitemap is indexed.
2. **PageSpeed Insights** (`https://pagespeed.web.dev/`) on the live domain —
   this is the manual gate in `docs/audits/final-audit.md`.
3. To point Lighthouse CI at the deployed URL instead of a local build, replace
   the `collect.url` list with the production URLs and drop
   `startServerCommand` (or run `LHCI_BUILD_CONTEXT__CURRENT_BRANCH` locally:
   `npx @lhci/cli collect --url=https://<domain>/`).
