# Design System

Two worlds live in this app: the internal software's operator UI (white/stone
with safety orange, Poppins) and the public site's Painted Board world. They
share the root layout and fonts but nothing visual.

## Software UI (internal, `(app)` routes)

Incumbent system, unchanged: white ground, stone-200 2px borders, orange-600
buttons, min-h-12 touch targets, Poppins, big-number cards for low-literacy
operators. Recorded by the impeccable documenter flow from
`src/app/globals.css` tokens and the existing views.

## Painted Board (public site, `(site)` routes)

Direction: seed key `9c7e9afa`, assigned index 6 (Scher street-typography
challenger fused with Indian painted-board signage). Chosen on the decision
page, 2026-10-22.

### Color — 60/30/10

| Role | Token | Value | Share |
|---|---|---|---|
| Ground (60) | `paper` | `#f4ead9` | paper wall behind everything |
| Field/type (30) | `ink` | `#171310` | wood-type ink, ink sections, footer |
| Action (10) | `ember` | `#b3541e` | the CALL band, hover fills, गिट्टी |
| Secondary field | `ochre` | `#e8a020` | close band only |
| Field shade | `paper-warm` | `#eaddc4` | reserved |

Rules: ember appears only where the visitor can act (call band, hover states,
the second painted word). No neutral grays — secondary text is ink at 70–80%
on paper, paper at 60–80% on ink. Contrast is checked at 4.5:1 for body.

### Type

- `font-paint` — Yatra One: brush-painted Devanagari + Latin, for display
  words and section headings. One weight; scale does the work.
- `font-poster` — Anton: wood-type caps for the material rows and phone
  numbers (tabular-nums so the number doesn't dance).
- `font-site-body` — Mukta: Devanagari body face, 18px+ on the public site.
- Hierarchy is scale-first: hero words at `clamp(4.5rem,16vw,13rem)`,
  section heads 4xl–6xl paint, row titles 4xl–5xl poster, body lg.

### Materials & form

- Print grain: `.site-grain::after` — SVG turbulence overlay at 7%, fixed,
  over the whole public site.
- Bands, not boxes: full-bleed color fields section the page; the CALL band
  is rotated off-frame (`.poster-tilt`) and oversized so the tilt can't clip.
- Lists are ruled rows (shop-shutter ledger), never icon-cards; the why
  section is painted shouts under a 4px ink rule.
- Icons: lucide at strokeWidth 2.5 in ember/ink — drawn, never emoji.
- Motion: one authored beat — the tilt of the ember band. Nothing else
  animates; `prefers-reduced-motion` is already respected globally.

### Components

The public site is eight routes under `src/app/(site)/` (/, /aggregates,
/m-sand, /stone-dust, /gsb, /plant, /service-area, /contact) sharing a
grained-paper shell (SiteHeader + SiteFooter). Shell/nav: `src/components/site/`
(SiteHeader with the ruled door-row nav, SiteFooter, MaterialPage template);
page paintings: `src/components/home/` (PaintedHero, MaterialRows, WhyPainted,
ContactBand, WhatsAppIcon); views in `src/views/site/`. Contact constants live
in `src/lib/site.ts` (owner-provided, not independently verified); canonical
domain is undecided, so sitemap/robots/canonicals are gated on
`NEXT_PUBLIC_SITE_URL`.

Interior pages reuse the world's devices: page titles in paint at 5xl–7xl,
one tilted ember band per product page carrying the number, ledger rows for
sizes/uses, bordered poster "doors" (never cards) for material links. No
kickers or eyebrows anywhere — a small-caps tracked line above a heading is
floor-banned and was removed at finish review. The photo exception is the
plant page: labeled representative stock (honesty caption) plus dashed
photo-slots awaiting the plant's own photography, per the research
photography plan; the rest of the world stays photo-free.

### Not yet done

- Real plant photos to replace the labeled stock and fill the slots. The
  owner's logo kit (2026-10-23) is integrated — primary lockup in the header,
  reverse lockup in the footer, icon-only mark as the favicon
  (`public/images/logo-*.png`, `src/app/icon.png`) — but it contained no plant
  photography.
- Browser-screenshot review is impossible in this harness (no browser tool);
  HTML smoke tests + clean detector pass stand in; first visual inspection
  is the user's.
- Sitemap/canonicals activate only after the owner sets a domain
  (`NEXT_PUBLIC_SITE_URL`).
