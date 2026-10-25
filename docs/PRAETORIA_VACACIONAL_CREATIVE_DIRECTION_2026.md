# Praetoria Vacacional — Creative Direction 2026
**Status:** design brief for implementation by Claude; not a production release.
**Objective:** make each real apartment feel like the beginning of an extraordinary escape, using the restraint of premium boutique hospitality without claiming the properties are luxury hotels.

## Brand idea
**Two landscapes. One unmistakable signature.**
- **Mar:** Valencia Frente al Mar, Playa de la Llastra / Sueca. Mediterráneo auténtico, luz, terraza, vistas frontales y acceso inmediato a la arena.
- **Montaña:** Javalambre Mountain SuperSki, Camarena de la Sierra / Teruel. Refugio serrano, luz cálida, nieve CUANDO existe, proximidad aproximada a pistas, tranquilidad y plan familiar.
- Both are apartments with direct booking, NOT hotels or resorts. Never advertise pool, spa, ski-in/ski-out, beachfront amenities, guaranteed snow, private services or views absent from that property.
- Sell the feeling of place with **authentic** photos of accommodation, real surrounding landscape and verified facts. Distinguish photos of property from nearby destinations.

## Benchmark principles — no copying
Aman: space, photographic hierarchy, calm.
One&Only: immersive sense of destination and art-directed imagery.
Oetker Collection: differentiated properties under a recognizable parent brand.
Editorial modernism: typography governs hierarchy, exacting grids and careful negative space. Avoid resort template and SaaS dashboard.

## Design system: same Praetoria family, separate hospitality palette
- **Wordmark**: 'PRAETORIA' in confident neo-grotesk akin to Helvetica; secondary 'VACACIONAL' smaller and tracked. The wordmark leads: no illustrated sun, snowflake, mountain emoji or stock resort icon.
- If a custom pictogram/monogram is used for favicon, propose at least 2 minimal concepts and obtain brand approval before replacing the existing mark universally.
- Font: prefer a properly licensed Helvetica/Neue Haas-type face; absent a license use a high-quality open-source neutral grotesk (e.g., Inter) with deliberate optical tracking. Current `Fraunces` display usage should be reviewed and removed from primary brand/headlines if it weakens the Praetoria family. Never bundle unlicensed fonts.
- Foundation: warm ivory `#F7F5F0`, graphite `#202827`, white `#FFFFFF`.
- Mar accent: muted deep petrol `#285D63`; sand `#C4AB8B`; pale mineral blue `#E5F0EF`.
- Montaña accent: dark pine `#304B43`; muted stone `#AAA79B`; cold snow `#EEF2F0`.
- Brand palette is deliberately **not** Praetoria Jurídica red; harmony comes from typography and composition. Respect WCAG AA.
- Avoid overly rounded cards, gradients as decoration, pill overload, emoji weather icons, fake glass blur, stock travel iconography, infinite carousels or generic hospitality clichés.
- Use a 12-column desktop grid, elegantly scaled layouts and responsive `clamp` type. Large headlines but extremely concise copy. One main CTA per view.

## Homepage: editorial narrative
1. **Cinematic opening:** true destination photographs with disciplined framing; max 1 short title + 1 supporting sentence + clear CTA 'Explorar estancias' or 'Consultar fechas'. Avoid long paragraph overlay.
2. **Dual-world decision:** MAR / MONTAÑA as two full-bleed editorial chapters/interactive panels; actual property names and geographic labels always legible. On mobile do not hide either destination or force carousel discovery.
3. **Booking availability:** immediately accessible from hero or after hero; preserve dates, guest count and real prices from existing server-side pricing.
4. **Valencia chapter:** horizon, framed sea view, sensory invitation; photographs of the real apartment mixed with **clearly contextualised** images of Playa de la Llastra / surroundings.
5. **Javalambre chapter:** winter landscape when seasonal/verified; fireplace/interior warmth, Camarena village and ski proximity; equally appealing summer/autumn representation when skiing conditions do not apply.
6. **Proof and ease:** authentic guest reviews (source and count), brief essentials and direct-booking reassurance integrated near CTA.
7. **Destination guides:** photography and editorial headlines, not blog-card wall.
8. **Final booking CTA** with consistent availability state.
Move lengthy technical descriptions, amenity bullet paragraphs and logistics into expandable or structured content on property pages, not hero.

## Property page system
- Distinct photographic sequence per property: signature view → emotional environment → truth of accommodation → comfort and practical details → reviews → booking.
- ES/EN consistent, proper titles and image alt descriptions; show real booking terms and total price.
- Destination photos can inspire, but clearly distinguish `Alojamiento` and `Entorno`. Do not misleadingly label shots as direct views from the apartment.
- Winter scene is seasonal and never promises snow. Avoid fabricated visual enhancements. Editorial color correction and crops permitted only if faithful.
- Keep established URLs, canonicals, hreflang, JSON-LD, metadata, indexed guides, and internal links.

## Implementation map
Current repo uses Next.js 15, React 19, Tailwind 4; default branch `develop`.
- `src/components/home/HomeView.tsx`: home visual hierarchy/copy; currently long hero paragraph and gradient overlay.
- `src/components/home/ExperienceSelector.tsx`: existing MAR/NIEVE UI, currently chip + card and emoji; elevate to premium editorial chooser.
- `src/components/layout/SiteHeader.tsx`, `SiteFooter.tsx`, `Logo.tsx`: refined family wordmark and navigation.
- `src/app/globals.css`: existing `data-experience=sea|ski` semantic tokens; refactor rather than duplicate.
- `src/app/layout.tsx`: currently Inter+Fraunces with font variables; align headings and brand.
- `src/content/properties/photos.ts`, `photo-manifest.json`, `src/components/media/Picture.tsx`: authentic photography, hero/crop management, AVIF/WebP sizes.
- `public/icon.svg`: existing pictorial mountain/wave mark; only replace after selecting minimal brand design.
- Preserve Supabase availability, Stripe payment, Resend, booking engine and existing analytics.

## Non-negotiable technical and quality gates
- First deliver screenshots of proposals for desktop 1440px and mobile 390px for HOME + both property pages; get approval **before** full rollout.
- No destructive production deployment, no changes to payment/pricing logic or admin dashboard as part of visual redesign.
- LCP target <=2.5s mobile p75; INP <=200ms, CLS <=0.1 where measured; preserve or improve existing baseline. Do not lazy-load LCP hero. Preload only the visible hero. Responsive formats, appropriate sizes and focal points.
- WCAG 2.2 AA target, keyboard navigation, visible focus, non-text contrast, prefers-reduced-motion and no text unreadable over photos.
- Test 320/390/768/1024/1440px. Run `npm run typecheck`, `npm run test`, `npm run build` and relevant Playwright flows.
- Compare previous/current screenshots and route SEO audit; no broken booking, mobile CTA, analytics events, i18n or indexation.
- Real booking metrics: `property_view`, `availability_search`, `checkout_start`, `booking_complete` if already defined; use existing naming rather than duplicate events.

## Release sequence
A. Design tokens, brand/photography audit and visual concept.
B. Home + selection/booking UI, behind safe branch/preview.
C. Property pages with photos and seasonal context.
D. Mobile performance/accessibility regression; verify SEO and booking.
E. Deploy only after previews approved.

Companion existing issues: #77, #86, #87, #88, #89, #90, #93, #98. The linked implementation issues below refine art direction and must not duplicate business or booking functionality already in those issues.
