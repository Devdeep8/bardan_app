# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 App Router (React 19) + Tailwind CSS 4, user-frontend of the patidar-stone-crasher monorepo; Express/Sequelize/Postgres backend. Bilingual (Hindi/English) throughout.

## Users

Two distinct audiences:

- **Plant software users (in-app, authenticated):** the manager and staff who run the crusher plant's daily order book; low-literacy operators, mobile phones, Hindi-first. Partners/owners log in read-only to see the account (roles planned). This audience lives behind `/login` → `/dashboard`.
- **Public website visitors (this surface):** builders, contractors, masons, and house-builders in the surrounding villages/towns who need ret (sand), gitti (crushed grit), or both, delivered by trolley. They browse on mobile, in Hindi, decide on rate and same-day delivery, and act by phone call or WhatsApp. *(inferred from domain knowledge of the business; confirm)*

## Product Purpose

Patidar Stone Crusher is a working gitti/ret crushing plant. The app portion is its internal hisab-kitab (order book, customer khata, planned expenses and cash handovers). The public homepage (`/`) is the plant's storefront on the web: tell buyers what material is available, build trust in a cash-first trade, and route them to a phone call or WhatsApp for today's rate and booking. Success = enquiries/calls from buyers and walk-ins who already know what the plant supplies.

## Positioning

A local plant that sells direct from the crusher: no middleman, rates told plainly each day, every trolley load written down (date, village, rate) so bills are never in dispute. *(positioning inferred; confirm claims with owner before final copy)*

## Operating Context

- Business is cash-first; rates are set daily and communicated verbally/by phone.
- Material is sold by the trolley (trolley = unit), in three forms: ret, gitti, or both mixed.
- Buyers are local: village name identifies each customer in the order book.
- Plant vocabulary (used across the app): ret, gitti, trolley, nagad/udhaar, village, grade.

## Capabilities and Constraints

- Public page must be bilingual hi/en (default hi) with the language toggle.
- Click-to-call and WhatsApp deep-link with a prefilled Hindi/English enquiry message are the primary conversion actions.
- No online payments, no price list on the site (rates change daily — tell callers, don't publish).
- `/` is public; everything under the `(app)` group stays auth-guarded. Staff entry at `/login`.
- The internal software's stone/orange identity exists, but the public site's visual world is an open decision.

## Brand Commitments

Name: Patidar Stone Crusher (पटीदार स्टोन क्रेशर). No logo asset exists yet.

## Evidence on Hand

- No plant photographs, no customer testimonials, no published rates — **must not be fabricated.** Real phone/WhatsApp number, plant location/address, and photos are needed from the owner (placeholders until then, listed for replacement).
- Internal order-book domain vocabulary is real and verified (see i18n files, USER_SIDE.md at repo root).

## Product Principles

1. Rate and availability by phone — the site's job is to make the call, not to sell online.
2. Local and plain-spoken: village-to-village Hindi-first copy, no corporate jargon.
3. Trust through transparency: written-down loads, fair daily rates, direct-from-crusher.
4. Mobile-first and low-bandwidth friendly.

## Open Decisions

- Real contact number(s), plant address/map, hours.
- Whether to include plant photos or an owner/team section once photos exist.
