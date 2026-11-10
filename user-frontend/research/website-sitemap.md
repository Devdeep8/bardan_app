# Website Sitemap — patidarstonecrusher.in (proposed, domain TBD)

```
/                     Homepage — products, coverage, trust strip, call/WhatsApp
/gitti                Product: crushed stone aggregate (sizes table)
/m-sand               Product: manufactured sand
/stone-dust           Product: stone dust / crusher dust
/plant                The plant: machinery, process, capacity (owner-confirmed only)
/bulk-supply          Bulk supply, loading, delivery radius, freight guidance
/about                The business, owner, location, why "direct from manufacturer"
/contact              Enquiry form + phone + WhatsApp + map + hours
/blog/                4–6 educational articles (see keyword map), added monthly
```

## Page purposes

- **/** — orient in 5 seconds: what we make, where we serve, phone number above the fold.
- **Product pages (3)** — one per genuinely distinct material. Shared block: sizes/grades (owner-confirmed only), uses, how supplied (tonne/truck), enquiry CTA. No extra thin pages per size.
- **/plant** — the trust engine. Photos (see photography plan), process steps (feed → jaw → cone → screening → stockpile), what we can and cannot claim.
- **/bulk-supply** — answers the freight question: service area, own/arranged transport, loading times, typical load sizes.
- **/contact** — one short form; click-to-call and wa.me link prominent.

## Technical notes (for the Next.js build in this repo)

- Next.js App Router, static pages with ISR not needed (content changes rarely); per-page metadata via `generateMetadata`/`metadata` export.
- JSON-LD: `LocalBusiness` (or `Organization`) with areaServed, `Product` per product page, `FAQPage` where FAQs exist.
- Sitemap.xml + robots.txt, hreflang not needed (single language, Hinglish copy).
- Mobile-first: >80% of local construction searches are mobile (hypothesis; standard for local trade searches).
