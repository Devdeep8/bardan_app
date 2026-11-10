# Conversion Strategy — Patidar Stone Crusher

## Journey

Google search ("gitti supplier Suwasra") → product/home page → understands material + sizes → trust (plant page, owner, coverage) → **call or WhatsApp** → rate discussion → site visit for large buyers → order.

## Primary CTAs (in priority order)

1. **Click-to-call** (`tel:` link) — sticky on mobile header and footer.
2. **WhatsApp** (`wa.me` with prefilled message: "Namaste, I need [material] approx [qty] delivered at [location]") — the dominant local enquiry channel.
3. **Short enquiry form** — only 5 fields: name, phone, material (dropdown: gitti / M-sand / stone dust / other), approximate quantity, delivery location. Required date optional.

No email-gated content, no newsletter, no account creation.

## Trust elements (only what can genuinely be supplied)

- Real plant photos (Phase 1: licensed stock, clearly not misrepresented; swap to real ASAP).
- Owner name + direct number + plant address with map.
- Honest service-area statement ("Suwasra and surrounding areas up to ~X km").
- Consents/licenses if they exist (GST, consent to operate) — **owner must confirm; do not display until verified**.

## Lead qualification

The 5 form fields + prefilled WhatsApp message give the sales side enough to quote: material, qty, location (→ freight). Respond within business hours same-day; publish hours on the contact page.

## Measurement

- Google Business Profile (call + WhatsApp tap as conversions via GA4 events `click_call`, `click_whatsapp`, `form_submit`).
- Form submissions tracked server-side if backend exists (this repo's user-frontend already has an order/enquiry backend for the internal app — decide whether public enquiries flow there or to WhatsApp only).
- Monthly review: GBP calls, GSC impressions/clicks per page, leads by material.

## Anti-patterns to avoid

- Publishing price lists (regional rates fluctuate ₹620–850/t retail; negotiating power lost).
- Long forms, OTP verification, or app-download prompts.
- Stock photos presented as the actual plant.
