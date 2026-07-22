# BKAS South Coast '26 — build contract (all section agents read this first)

We are building ONE static page: **Bro Knows A Spot presents "South Coast '26"** — an
8-day Sri Lanka south-coast group trip. Structure & interaction patterns are inspired by
a reference site's *behavior* (preloader → pill nav → sliders → color-blocked sections →
big CTA), but every pixel, line of code, and word here is ORIGINAL, in the BKAS brand.
Do not copy any code or copy from ~/nomadico-reference (do not even open it).

## Your output files (write ONLY these, exact paths)
- `~/bkas-site/web/sections/<NN>-<name>.html` — an HTML FRAGMENT (no <html>/<head>/<body>)
- `~/bkas-site/web/css/<NN>-<name>.css` — styles for your fragment only
- `~/bkas-site/web/js/<NN>-<name>.js` — OPTIONAL, an IIFE, only if your section needs JS

NN and name are given in your task. Never touch base.css, site.js, index.html, other
agents' files, or anything outside your three files. Do not run servers or browsers —
the orchestrator integrates and QAs.

## Brand tokens (already loaded globally by base.css — just use them)
- Colors: `--cream:#F2E9CE` `--ink:#221A12` `--terra:#B4502A` `--marigold:#F0A21E`
  (marigold: tiny accents only, e.g. one highlight word — it's semi-reserved)
- Fonts: `--font-display` = Shrikhand (brand voice: big headlines, one move per section,
  never body text) · `--font-body` = Archivo variable (wght 100–900, wdth 62–125%;
  labels = 700–800 letter-spaced caps via class `.label`)
- Shared classes from base.css you may use:
  `.wrap` (max-width 1200 center) · `.label` (letterspaced caps) ·
  `.pill` / `.pill--ink` / `.pill--cream` (rounded buttons) ·
  `.reveal` (IO fade/rise-in: put on elements to animate; base site.js handles it) ·
  `.grain` (adds film-grain overlay ::after — use on photo containers)
- Section color-blocking: set your section's own background (cream ground is default
  body bg; ink and terra sections set their own).

## Assets (relative to index.html — use these exact paths)
Photos (all pre-graded warm/film): `assets/img/hero.jpg` (aerial surf coast, 1920w),
`ahangama.jpg` (turquoise bay), `weligama.jpg` (bay + island), `mirissa.jpg` (colorful
fishing boats), `hiriketiya.jpg` (yellow boat on beach cove), `party.jpg` (sunset crowd
silhouettes), `self.jpg` (spa candles/stones), `nature.jpg` (jungle stream), `scooter.jpg`
(scooters street), `tuktuk.jpg` (red tuk-tuks), `stay.jpg` (purple palm sunset),
`closing.jpg` (friends jumping at sunset, 1600w).
Map: `assets/img/route_map.svg` (teal route map, 1180x430).
Brand SVGs: `assets/brand/sunburst-stacked-cream.svg`, `sunburst-horizontal-ink.svg`,
`sunburst-star-icon-cream.svg`, `sunburst-star-icon-ink.svg`, `sunburst-sticker-cream.svg`.

## Trip facts (single source of truth — do NOT invent beyond this)
- 8 days / 7 nights · 1–8 September 2026 · Sri Lanka south coast
- Route: Ahangama → Weligama → Mirissa → Hiriketiya (4 bases, ~12-bedroom villa per base)
- 21 seats @ ₹50,000/head
- INCLUDED: villas · airport transfers · scooters · move-day tuk-tuks · one luxury spa
  session · one surf lesson · one sauna + ice-bath session (each per guest)
- NOT included (guests pay their own): all food & meals, alcohol, party entries,
  international flights, visa. No food kitty, no drinks bucket. (This honesty is brand
  voice — own it, don't bury it.)
- Trip themes: **Party · Self · Nature**
- CTA: "Claim a seat" → link `https://wa.me/919063492584?text=I%20want%20a%20seat%20on%20South%20Coast%20%2726`
  (placeholder number, orchestrator may swap)

## Voice
Confident friend who's already been there. Short sentences. Specific. Zero gatekeeping,
zero "wanderlust"/"paradise" clichés, no emoji in page copy. Tagline: **"Worth the
detour."** — always with the period. "Bro" appears ONLY in the brand name.

## Craft bar
Mobile-first responsive (grid/flex + gap, no horizontal page scroll), generous margins,
one Shrikhand move per section, `prefers-reduced-motion` respected for any animation you
add, real alt text on every image. Class-prefix everything with your section name
(e.g. `.spots-…`) to avoid collisions.
