# Patidar Stone Crusher — User Side, State of the Project

> A consolidated understanding of everything built so far for the **user (staff/operator) side** — `user-backend` + `user-frontend` — as of 2026-09-19.

## 1. What this app is

A bilingual (Hindi/English) **order book for a stone crusher business**. Staff sign in, record customer orders (customer identified by 10-digit phone), track payments against each order, and browse orders month-by-month. It is deliberately built for **low-literacy operators**: huge touch targets, minimal reading, one screen per task, Latin digits in both languages.

- Orders are amounts in ₹ with `total_amount` / `amount_received`.
- Payment **status is never stored** — always derived: `unpaid` / `partially_paid` / `paid`.
- Customers are deduplicated **by phone**; an existing customer's name is **immutable**.

⚠️ [user-frontend/PRODUCT.md](user-frontend/PRODUCT.md) describes a *Mumbai boat charter service* — that is stale template content from the project this was scaffolded from. Ignore it. The real product is the stone-crusher order book described here.

## 2. Repo layout

| Folder | What it is | Port |
|---|---|---|
| `user-backend/` | Express + Sequelize API for staff (**this doc**) | 3004 |
| `user-frontend/` | Next.js operator app (**this doc**) | 3000 (dev) |
| `admin-backend/` | Separate admin API (mirrors the same skeleton) | 3006 |
| `admin-frontend/` | Separate admin Next.js app | — |
| `executor/` | Infra only: `docker-compose.yml` (Postgres 15, Redis 7, both backends) + Makefile | 5432 / 6379 |

Frontends are **commented out** in docker-compose — they run locally with `npm run dev`; backends run in compose with hot reload (`nodemon` + SIGUSR2-safe graceful shutdown).

## 3. How to run

```bash
# infra + backends (from executor/)
docker compose up -d        # postgres, redis, user-backend :3004, admin-backend :3006

# frontend (from user-frontend/)
npm run dev                 # http://localhost:3000
```

- DB: `patidar-stone-crusher-website-db` (postgres/postgres), Redis empty password.
- Frontend hits `NEXT_PUBLIC_API_URL=http://localhost:3004` ([.env](user-frontend/.env)).
- **Demo login** (hint shown on the login screen): `staff@crusher.com` / `Staff@123` — the idempotent seeder is owned by `admin-backend`; do not use demo credentials in production.

---

## 4. user-backend

### Stack

Node ESM + **Express 4**, **Sequelize 6 + Postgres**, Redis (ioredis) + Bull (scaffolded, unused), **JWT** auth (jsonwebtoken + bcrypt), **ajv** request-schema validation, **convict** config, **pino** logging, `express-rate-limit` / `rate-limiter-flexible`. Scripts: `dev` (tsx), `dev:nodemon`, `start`. `package.json` name is still `crm-simple-mvp-backend`.

### Request lifecycle (the core pattern)

```
route → contextMiddleware(bool) → isUserAuthenticated() → requestValidationMiddleware(ajv schema)
      → Controller (static method) → Handler.execute(args, req.context) → sendResponse()
```

- [context.middleware.js](user-backend/src/rest-resources/middlewares/context.middleware.js) builds `req.context` (traceId, logger, locale, models) and, when called with `true`, opens a Sequelize transaction that auto-commits on 2xx and auto-rolls-back on 4xx/5xx (`res.on('finish'/'close')`).
- Controllers are thin statics: [auth.controller.js](user-backend/src/rest-resources/controllers/auth.controller.js) also owns the auth **cookies**; everything else just delegates.
- Business logic lives in **handler classes** extending `BaseHandler` ([services/](user-backend/src/services/)) — each `run()` returns the payload; `this.dbTransaction` / `this.traceId` / `this.logger` come from the base.
- Response envelope everywhere: `{ success, message, data }` / error `{ success: false, errors: { code, message } }`.

### API surface (all under `/api/v1`)

| Endpoint | Auth | Transaction | Purpose |
|---|---|---|---|
| `POST /auth/login` | public, rate-limited 10/15min/IP | — | Email+password → JWT pair (cookies + body) |
| `POST /auth/refresh` | refresh cookie | — | Rotate token pair; clears cookies on failure |
| `GET /auth/me` | user | read | Profile |
| `POST /auth/logout` | user | — | Clears cookies (stateless JWT) |
| `POST /orders` | user | **write** | Create order; find-or-create customer by phone. `total_amount` optional — computed as `quantity × rate` when omitted |
| `GET /orders?month=YYYY-MM` | user | read | Month's orders, newest `order_no` first, customer joined |
| `GET /orders/:id` | user | read | Single order + customer |
| `PATCH /orders/:id` | user | **write** | Update `amount_received` only (status recomputed) |
| `GET /customers/lookup?phone=` | user | read | Order-form autofill → name + preferred_language + `last_order` (village/material/grade/quantity/rate/payment_type from the customer's latest order), 404 if new |
| `GET /customers?page=1&limit=20&search=` | user | read | Khata index: paginated customers with all-time stats (`orders_count`, `total_amount`, `total_pending`); search matches name (substring) or phone (digit prefix, ≥3 digits) |
| `GET /customers/:id/orders?page=1&limit=10` | user | read | One customer's order history, newest `order_no` first, paginated, plus all-time totals |
| `GET /blogs`, `GET /blogs/:slug` | **public** | read | Blog list/detail (no auth middleware) |
| `/demo/*` | public | — | Scaffold demo (`/crash`, `/transaction-test`) |

### Auth design

- Access JWT 15m, refresh JWT 7d, separate secrets (`jwt.loginTokenSecret` / `refreshTokenSecret`).
- Stored as **httpOnly cookies** (`user_access_token`, `user_refresh_token`, `sameSite: lax`, `secure` in prod) *and* returned in the body for non-browser Bearer use.
- [isUserAuthenticated.middleware.js](user-backend/src/rest-resources/middlewares/isUserAuthenticated.middleware.js): prefers `Authorization: Bearer`, falls back to the cookie; rejects non-`access`-type tokens and inactive users.
- Login returns the **same error** for unknown email vs wrong password (no user enumeration); updates `lastLoginAt`; `User.toJSON()` strips the password hash.

### Data model ([src/db/models/](user-backend/src/db/models/))

- **`users`** — UUID pk, name, unique email, bcrypt password, `isActive`, `lastLoginAt`.
- **`customers`** — UUID pk, **unique 10-digit phone** (validated `^[0-9]{10}$`), name, `preferred_language` enum `hi|en` default `hi`.
- **`orders`** — UUID pk, unique human `order_no` (starts **1010** for new orders; existing lower numbers are preserved), `customer_id` FK (RESTRICT on delete), `total_amount` / `amount_received` DECIMAL(12,2), instance-level guard `received ≤ total`, plus the Phase-1 **bahi-khata fields** (all nullable — requiredness enforced in the handler): `village` STRING(100), `material` ENUM(`ret`/`gitti`/`both`), `grade` STRING(50) free text, `quantity` INTEGER (trolleys), `rate` DECIMAL(12,2) (₹/trolley), `payment_type` ENUM(`nagad`/`udhaar`/`online`) — informational only, never affects derived status — and `note` STRING(500).
  - [order.model.js](user-backend/src/db/models/order.model.js) owns `computeOrderStatus()` and a custom `toJSON()` that emits the API contract: snake_case keys, numbers (not pg strings), the **derived `status`**, and null-safe bahi-khata fields (pre-Phase-1 orders render with nulls).
- Also loaded: `sessions` (User hasMany), `adminUsers`, `blogs`, `packages` — scaffolded for later.

### Schema changes — migrations only

The Postgres DB (`patidar-stone-crusher-website-db`) is **shared with admin-backend**. All schema migrations and seeders are owned and run by `admin-backend`; user-backend retains the Sequelize models it needs at runtime and has no migration/seeding CLI or database role with schema privileges.

- Run `npm run db:migrate` and, only in non-production environments, `npm run db:seed` from `admin-backend/`.
- The Phase-1 order schema migration is [20260920101609-add-order-bahi-khata-fields.cjs](admin-backend/src/db/migrations/20260920101609-add-order-bahi-khata-fields.cjs).

**Never** change schema with `sequelize.sync({ alter: true })` — it created a duplicate unique index and flipped the FK to SET NULL when tried once. Migrations are the only path.

### Order creation flow ([order.handler.js](user-backend/src/services/orders/order.handler.js))

1. Service-level checks: strict 10-digit phone; required `village` (trimmed 2–100), `material` and `payment_type` (enum membership), `quantity` (integer 1–999); optional `grade`/`note` (length-capped) and `rate` (0–9,999,999).
2. **Total**: an explicit `total_amount` wins; otherwise it is computed as `quantity × rate` (missing both → 400).
3. `amount_received ≤ total_amount` check.
4. Find-or-create customer by phone — a **different name for a known phone is silently ignored** (the form locks the field anyway).
5. `order_no = max(max(order_no), 1009) + 1`, so new order numbers start at 1010 while existing orders remain unchanged; retried up to 3× on unique-collision from concurrent creates.
6. All inside the request transaction from `contextMiddleware(true)` — customer + order commit or roll back together.

### House conventions (established in this project — follow them)

- **`contextMiddleware(true)` for writes, explicit `contextMiddleware(false)` for reads.**
- **Business validation lives in the handler's `run()`** (phone rules, amount rules) — ajv schemas only shape/parse the request. E.g. the 10-digit phone rule is raised from the service.
- **Never edit** `base.handler.js` or `error.middleware.js`.
- **Import models from the db module** (`import db from '@src/db/models/index.js'`) — the `this.context.models` pattern was rejected. (Older handlers — auth, packages — still use `context.models`; new code uses the direct import.)
- Route files carry `@route/@desc/@access` doc comments above every endpoint.

### Scaffolded but NOT wired up

- **Packages**: full handler set ([package.handler.js](user-backend/src/services/packages/package.handler.js) — list/get/create/update/soft-delete, pagination), controller, and ajv schema exist, but **no `/packages` route is registered** in [api/v1/index.js](user-backend/src/rest-resources/routes/api/v1/index.js).
- Blogs are public and unauthenticated; no blog write path on the user side.
- No migrations/seeders yet (models sync via Sequelize; `.sequelizerc` paths are aspirational).

---

## 5. user-frontend

### Stack

**Next.js 16 App Router** (React 19, TS), **Tailwind CSS 4**, shadcn/ui primitives (button/card/input/badge), lucide-react icons, **no data-fetching lib** — hand-rolled fetch services; **no state lib** — hand-rolled `useSyncExternalStore` auth store. The repo also carries an `impeccable` agent-skill (`.agents/`, `.claude/`, `SKILL.md`) — tooling, not product code. ⚠️ This Next version intentionally diverges from training-data conventions (see [AGENTS.md](user-frontend/AGENTS.md) — read `node_modules/next/dist/docs/` before writing Next-specific code).

### Routes

| Route | File | Access |
|---|---|---|
| `/login` | [login/page.tsx](user-frontend/src/app/login/page.tsx) | public |
| `/` (dashboard) | [(app)/page.tsx](user-frontend/src/app/(app)/page.tsx) | guarded |
| `/new` | [(app)/new/page.tsx](user-frontend/src/app/(app)/new/page.tsx) | guarded |
| `/orders/[id]` | [(app)/orders/[id]/page.tsx](user-frontend/src/app/(app)/orders/[id]/page.tsx) | guarded |
| `/customers` | [(app)/customers/page.tsx](user-frontend/src/app/(app)/customers/page.tsx) | guarded |
| `/customers/[id]` | [(app)/customers/[id]/page.tsx](user-frontend/src/app/(app)/customers/[id]/page.tsx) | guarded |

[(app)/layout.tsx](user-frontend/src/app/(app)/layout.tsx) is the guard + shell: waits for auth hydration (spinner, no login-flash), redirects to `/login` when unauthenticated, renders `AppHeader` (brand + language toggle + logout).

### Session handling (the clever bit)

- Tokens live in **httpOnly cookies** managed by the backend; the access token is mirrored **in memory only** ([api.service.ts](user-frontend/src/services/api.service.ts)) for the `Bearer` header — nothing in localStorage.
- [auth.store.ts](user-frontend/src/store/auth.store.ts): framework-free store bound via `useSyncExternalStore`; `hydrate()` calls `/auth/me` once on mount (with `hydrated` flag so guards don't redirect early).
- `apiRequest` speaks the backend envelope, and on any 401 runs a **single-flight `/auth/refresh`** (parallel 401s share one promise) and retries the original request once. Login/refresh/logout paths never trigger the retry loop.
- `ApiError` carries `code` + `statusCode`; `NETWORK_ERROR` for unreachable servers.

### Screens

**Dashboard** ([DashboardView.tsx](user-frontend/src/views/DashboardView.tsx)) — month stepper (‹ September 2026 ›, no calendar picker), four summary cards (orders / total / received / pending, computed client-side from the list), big orange **+ New Order** button, tappable order rows (#order_no · name · phone · bahi-khata second line "रेत ×2 · जमुनिया" when present · ₹total · balance · `StatusBadge`), loading / retry / empty states.

**New Order** ([NewOrderView.tsx](user-frontend/src/views/NewOrderView.tsx)) — single-screen entry following the founders' bahi-khata line:
1. Phone (numeric keypad, 10 digits) → debounced (400ms) `customers/lookup` → autofills name and **locks it** (🔒, `readOnly`) for existing customers; also prefills village/material/grade/rate from `last_order` (all still editable).
2. Village (required).
3. Material segmented control — रेत / गिट्टी / दोनों, no default (explicit choice required).
4. Grade as preset chips (सिंगल ट्रॉली, डबल ट्रिप, सिंगल, डबल, 6mm, 12mm, 20mm, 40mm, ब्रिक — Devanagari domain vocabulary in both languages) + "Other" chip revealing free text. Chip list is pure UI — grade is stored as free text, so it can be tuned anytime without touching data.
5. Trolley count as a big − / value / + stepper (1–999, no keyboard needed).
6. Rate (₹ per trolley).
7. **Live total** = trolleys × rate shown big (e.g. `₹11,000 = 2 × ₹5,500`), with an "Edit Total" toggle for manual override (mixed loads).
8. Payment mode segmented control — नगद (default) / उधार / ऑनलाइन — informational only.
9. Payment status as a **segmented control** (Unpaid / Partially Paid / Paid) — `amount_received` is *derived* from the choice; only "Partially Paid" reveals a numeric field.
10. Optional note (delivery time, instructions…).
11. Localized validation → `POST /orders` → success banner, form resets for the next order, redirect home after 1.5s. Backend field errors (phone/village/material/rate/total) are surfaced as the localized messages.

**Order Detail** ([OrderDetailView.tsx](user-frontend/src/views/OrderDetailView.tsx)) — key/value rows (order no, customer, phone, village, material, grade, trolleys, rate, payment mode, note — null rows hidden for pre-Phase-1 orders — then localized date, total / received / balance), one-tap "mark fully paid" plus an editable received amount (`PATCH`), status badge; server recomputes status.

**Customers** ([CustomersView.tsx](user-frontend/src/views/CustomersView.tsx), 2026-09-20) — the khata index, reachable from the header's "ग्राहक / Customers" button on every page: debounced search (name substring or phone prefix), tappable customer rows (name · phone · "N orders" · pending in red), and a big ‹ page x / y › [Pagination](user-frontend/src/components/Pagination.tsx) stepper styled like the month stepper. 20 rows/page.

**Customer Orders** ([CustomerOrdersView.tsx](user-frontend/src/views/CustomerOrdersView.tsx)) — one customer's khata page: header card with all-time totals (orders / total / pending, pending red when > 0), then their full order history newest-first as dashboard-style rows (tapping opens the order detail), paginated 10/page.

### i18n & formatting

- [lib/i18n/](user-frontend/src/lib/i18n/): `en.json` + `hi.json`, React-context `useLanguage()` hook; header toggle shows the *other* language's name ("हिंदी" / "English").
- [format.ts](user-frontend/src/lib/format.ts): `formatINR` (en-IN grouping → `₹1,23,456`), localized month/date labels, `currentMonth`/`shiftMonth` for the stepper. Numbers stay **Latin digits in both languages** — operators read them faster.

### Design language

Stone/orange palette on `bg-stone-100`, 2px borders, rounded-xl cards, oversized everything for field use: `size-14` nav buttons, `min-h-14` segmented buttons, `h-16` primary buttons with `text-2xl font-extrabold`, `text-lg` body copy, colored status semantics (red = unpaid, amber = partial, green = paid).

---

## 6. Where things stand

**Done and working (user side)**
- Full auth loop (login → cookies → /me hydration → silent refresh → logout) with rate limiting and enumeration safety.
- Orders CRUD-lite (create / list-by-month / detail / update received) with transactional customer find-or-create and human order numbers.
- **Phase 1 bahi-khata capture** (2026-09-20): village/material/grade/trolleys/rate/payment-mode/note on orders, computed `total = quantity × rate` with manual override, `last_order` prefill on lookup, dashboard + detail surfacing, full hi/en i18n. Schema changes are migrated and seeded from `admin-backend/`.
- Customer lookup autofill powering the order form.
- **Customer-wise khata** (2026-09-20): paginated customer index with all-time order stats + search (name/phone), and per-customer order-history pages — all paginated server-side.
- Bilingual operator UI: dashboard, new order, order detail, customers, customer orders.
- Dockerized infra with healthchecked Postgres/Redis and both backends hot-reloading.

**Scaffolded, unused**
- Packages handler/controller/schema (no route), blogs public reads, `sessions`/`adminUsers` models, Bull/Redis queues, multer, demo endpoints.

**Known gaps / next candidates**
- Phase 2 (per the founders' habits): delivery status (pending/truck sent/delivered), forwarding to the driver group, true multi-material line items, khata-photo OCR, and the "paste a WhatsApp line" parser that pre-fills the form.
- No user/staff management flow (create/deactivate users) anywhere yet.
- `package.json` names (`crm-simple-mvp-backend`) and `PRODUCT.md` (boat charter) are stale template leftovers.
- Dashboard month list is still unpaginated (a month's orders are few by design); customer pages are paginated.




// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhraQl4cek8Ogz1dHEfERDweiqDNR27Ek",
  authDomain: "bardan-app.firebaseapp.com",
  projectId: "bardan-app",
  storageBucket: "bardan-app.firebasestorage.app",
  messagingSenderId: "347819271222",
  appId: "1:347819271222:web:1135ea7aba5ee47ecea497",
  measurementId: "G-62TTB3FERN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);