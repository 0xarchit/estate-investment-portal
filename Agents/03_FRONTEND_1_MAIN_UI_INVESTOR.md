# 03 — FRONTEND 1 (P3): MAIN UI (design system, layouts, landing, marketplace, detail) + INVESTOR MODULE

> Paste into your AI session **after** `00_TEAM_CONTEXT.md` and `SPEC.md`.
> You are **P3 (Frontend 1)**. You are the frontend lead: P4 (Admin) and P5 (Broker + Auth) build on your kit, layouts, API client and types. **Push the KIT by T+20** (stubs with agreed props are fine), then polish. You also own the entire investor slice.

## Your role
Two parts: (A) **Main UI** — design system, shared kit, layouts, landing, marketplace, property detail; (B) the isolated **Investor module** — dashboard, portfolio, invest checkout, wallet, KYC, notifications page. Rubric weight: UI/UX (10), Investment UX (part of 15), Portfolio & dashboards (part of 10), P0 marketplace/detail pages, Code quality (8).

## Files you OWN (touch nothing else)
**Main UI:** `app/layout.tsx`, `app/globals.css`, `tailwind.config.*`, `components.json`, `app/page.tsx`, `app/properties/**`, `app/403/**`, `app/not-found.tsx`, `app/notifications/**`, `components/ui/**`, `components/shared/**` (incl. `shared/charts`), `components/property/**`, `components/layout/**`, `lib/api/client.ts`, `lib/api/properties.ts`, `lib/format.ts`, `lib/calc.ts`, `lib/types.ts`.
**Investor slice:** `app/investor/**` (layout, dashboard, portfolio, `invest/[id]`, wallet, kyc), `components/investor/**` (incl. `nav.ts`), `lib/api/{investments,wallet,portfolio,kyc,notifications}.ts`.

## Files you must NOT touch
`lib/auth/**`, `app/login|signup|profile/**`, `app/broker/**`, `components/broker|auth/**` (P5); `app/admin/**`, `components/admin/**`, `lib/api/admin.ts` (P4); `package.json` (P1 installed everything; need a dep? ask P1); backend.
Never import from `components/admin` or `components/broker`. Others import **only** your kit (`components/ui|shared|property|layout`, `lib/api/client`, `lib/format`, `lib/types`).

---

## PART A — MAIN UI

### Task 1 — Foundation & KIT (T+8 → T+20, **PUSH BEFORE ANYTHING ELSE**)
1. `npx shadcn@latest init` (pull P1's scaffold first) + add: button, input, label, select, textarea, checkbox, switch, dialog, dropdown-menu, tabs, table, badge, card, skeleton, slider, progress, tooltip, sheet, separator, avatar, popover, form, accordion.
2. Tokens (Tailwind theme + CSS vars): navy `#0F2A4A` (primary), emerald `#10B981`, gold `#D4A017`, bg `#F7F8FA`, surface `#FFFFFF`, danger `#DC2626`, warning `#F59E0B`, text `#111827`, muted `#6B7280`. Fonts via `next/font`: Inter body, Plus Jakarta Sans headings (600–700). `tabular-nums` for numbers. 8-pt spacing, card radius 12–16px, subtle shadows, visible focus rings, light theme default.
3. `lib/format.ts` (signatures in §9): `formatINR(paise)` via `Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'})` on `paise/100`; `formatCompactINR(paise)` → `₹1.4 Cr` / `₹25 L` / `₹5,000`; `formatPct`, `formatDate`. Unit-test `₹1,00,00,000`.
4. `lib/api/client.ts`: axios `baseURL:'/api/v1'`, request interceptor adds `Authorization: Bearer <localStorage fre_token>`, response interceptor: 401 → remove token and go to `/login` (skip when already there). `unwrap<T>(promise)` returns `res.data.data`, throws `{ code, message, details, status }` from the standard error shape.
5. `lib/types.ts`: User, Property (+`fundingPct`, `remainingUnits`, `investorCount`, `broker`), Investment, Transaction, Payout, Withdrawal, Notification, `Paginated<T>`, `ApiErrorShape`, `Role`, `PropertyStatus` — copied from §5/§7 of the context. P4/P5 may ask you to add types.
6. `app/layout.tsx`: fonts, `<QueryClientProvider>`, `<AuthProvider>` (from P5; until it lands comment out + TODO), `<Toaster/>`.
7. **Shared components with the exact props from §9** in `components/shared/`: `StatusChip` (status colours + text + icon), `FundingBar` (`role="progressbar"`, emerald fill, "47% funded"), `Money`, `StatCard` (loading skeleton, tone), `PageHeader`, `EmptyState`, `ErrorState`, `ConfirmModal`, `DataTable` (sticky header, sortable columns, row hover, skeleton rows, empty state, pagination footer, `onRowClick`), `Pagination`, `PageSkeleton`, and **chart wrappers** `shared/charts/{DonutChart, LineAreaChart, BarChartH}` (Recharts, responsive, tooltips with `formatINR`, "No data yet" placeholder, text summary for a11y). **Push the moment they render, even unpolished, and tell P4 + P5.**

### Task 2 — Layouts (T+15 → T+35)
- `components/layout/PublicLayout.tsx`: navbar (logo, Marketplace, How it works, login/signup or dashboard link when logged in), responsive menu, **footer with the required disclaimer: "This is an academic project. No real money or securities are involved."**
- `components/layout/DashboardLayout.tsx` — props `{ nav: NavItem[]; roleLabel: string; children }`: sidebar generated from `nav` (collapsible on mobile via Sheet), top bar with page title slot, **wallet balance chip shown automatically when `user.role === 'INVESTOR'`** (`GET /wallet`, key `['wallet']`), **notifications bell** with unread badge + dropdown (`GET /notifications`, `PATCH /notifications/:id/read`, link to `/notifications`), avatar menu (Profile → `/profile`, Logout via `useAuth`), footer disclaimer. **It must NOT know about specific roles' pages** — everything role-specific comes from `nav`.
- Push `DashboardLayout` + stubs by **T+20** so P4 and P5 can create their own `app/<role>/layout.tsx` + `nav.ts`.
- Your own: `components/investor/nav.ts` (Dashboard `/investor`, Marketplace `/properties`, Portfolio, Wallet, KYC, Notifications) and `app/investor/layout.tsx` = `<RoleGuard roles={['INVESTOR']}><DashboardLayout nav={investorNav} roleLabel="Investor">`.
- `/403` ("You don't have access") and `not-found` pages with back button.

### Task 3 — Property components (T+35 → T+50)
`components/property/`: `PropertyCard` (image, title, city, type badge, **price/unit**, **FundingBar**, expected return, status chip, units remaining → `/properties/[id]`), `PropertyGallery` (main + thumbnails/Swiper, keyboard accessible, 1–8 images, placeholder), `MetricsCard`, `ReturnCalculator`, `MapEmbed` (OpenStreetMap iframe from `geo`, graceful fallback), `DocumentsList`. `lib/calc.ts`: `ownershipPct(units,total)`, `projectedValue(amountPaise, appreciationPct, years)` = `amount*(1+pct/100)^years` rounded to integer paise (display only).

### Task 4 — Public pages (T+45 → T+80)
- **Landing `/`**: hero with value proposition + CTAs, how-it-works (4 steps: Sign up & KYC → Add funds → Pick a property → Earn on sale), **featured LIVE properties** (`GET /properties?status=LIVE&limit=3`), platform stats strip (hide gracefully if unavailable), FAQ accordion, CTA, footer.
- **Marketplace `/properties`**: filters sidebar (drawer on mobile): city, type, price/unit range (₹ → paise), status (LIVE/FUNDED), funding % range; debounced search; sort (newest, price/unit, funding %); pagination (`limit=9`). **Sync all filters to the URL.** Skeleton grid, empty state ("No properties match" + clear filters), error state with retry.
- **Property detail `/properties/[id]`**: gallery, title/city/status, metrics card, **funding progress**, units sold/remaining, **investors count**, description, documents, **map embed**, **return calculator** (amount → ownership % → projected value after N years, slider default = holding period), sticky **Invest CTA**: guest → `/login?next=…`; BROKER/ADMIN → disabled with tooltip "Only investors can invest"; status ≠ LIVE → disabled "Funding closed"; KYC ≠ APPROVED → link to `/investor/kyc`. Handle 404/403.

---

## PART B — INVESTOR MODULE (your isolated slice)

Create `lib/api/{investments,wallet,portfolio,kyc,notifications}.ts` (typed with `unwrap`) first.

### Task 5 — Invest checkout `/investor/invest/[id]` (T+70 → T+105) ⭐ rubric-critical
Data: `GET /properties/:id`, `GET /wallet`, `GET /investments/me` (existing units for the cap). Display-only math (server recomputes everything).
- Unit selector: slider + numeric input synced; min = `minUnits`, max = `min(remainingUnits, maxUnitsPerInvestor − myUnits)`; quick chips (min, 10, 25, max).
- **Live summary**: amount = units × unitPrice, ownership %, projected value, wallet balance, balance after.
- **Error prevention:** wallet < amount → disable button and show exactly how much more is needed ("Add ₹X more" → `/investor/wallet`). KYC ≠ APPROVED → banner linking to `/investor/kyc`.
- Terms checkbox → **Confirm modal** → `POST /investments {propertyId, units, idempotencyKey: crypto.randomUUID()}` — **button disabled while pending**, one key per attempt (regenerate only after an error).
- Errors by code: `INSUFFICIENT_UNITS` → toast + refetch property + clamp selector ("Only N units remain"); `INSUFFICIENT_BALANCE`; `KYC_NOT_APPROVED`; `MAX_OWNERSHIP_EXCEEDED`; `PROPERTY_NOT_LIVE`; `TOO_MANY_REQUESTS`.
- **Success screen**: "You now own X% of <title>", units, amount, new wallet balance, links to Portfolio / Marketplace; optional confetti on first investment. Invalidate `['wallet']`, `['portfolio']`, `['property', id]`, `['properties']`.

### Task 6 — Investor dashboard `/investor` (T+60 → T+90) ⭐ P0
Data: `GET /portfolio/summary`. KPI cards: **Total invested, Current value, Total payouts, Overall ROI** (emerald/red with sign), **Wallet balance**. **Allocation donut by property** (`DonutChart`), recent transactions (last 5; ▲/▼ + colour), "Recommended properties" (`GET /properties?status=LIVE&limit=3` → `PropertyCard`). **Empty state for a brand-new investor** (`fresh@demo.com`): clean zeros (no NaN), friendly message + "Browse properties", KYC reminder banner when `user.kyc.status !== 'APPROVED'`.

### Task 7 — Portfolio `/investor/portfolio` + holding detail (T+85 → T+110) ⭐ P0
`GET /investments/me` → `DataTable`: property, units, ownership %, invested, est. value, status chip, payout received, ROI % (red/emerald, sign + text). Sortable, empty state. **Row click → `/investor/portfolio/[propertyId]`**: summary, invested vs estimated vs payout, status timeline (LIVE → FUNDED → HOLDING → SOLD with current step highlighted), link to public property page, this holding's transactions.

### Task 8 — Wallet `/investor/wallet` (T+95 → T+120) ⭐ P0 (WAL-1)
- Balance card; **Add money** modal: amount (₹, chips ₹10,000 / 50,000 / 1,00,000, min ₹100), banner **"TEST MODE — no real money"**. Flow: `POST /wallet/topup/order {amount(paise)}` → mock checkout step ("Pay ₹X (test)") → `POST /wallet/topup/verify` with `orderId` + `mockPayment {paymentId, signature}` → toast, invalidate `['wallet']` + ledger. Handle `DUPLICATE_PAYMENT` and bad signature.
- **Withdraw request** modal (amount ≤ balance, dummy bank details: name, account number, IFSC; zod) → `POST /wallet/withdraw`; own withdrawals list with status chips.
- **Ledger table** (`GET /transactions`): date, type badge, ▲ credit / ▼ debit (colour + text), amount, balance after, reference; filters type + date range; pagination.

### Task 9 — KYC `/investor/kyc` + `/notifications` (T+110 → T+125)
KYC: status badge (NOT_SUBMITTED / PENDING amber / APPROVED emerald / REJECTED red + reason); upload dummy ID + selfie (jpg/png/webp/pdf ≤5 MB) via `POST /uploads` → `POST /kyc {docs}`; disabled while PENDING/APPROVED, resubmit when REJECTED; "dummy data only" note. `/notifications`: list, unread highlight, mark read / mark all read, links.

### Task 10 — Polish (T+125 → T+140)
360px / tablet / desktop, no horizontal scroll; skeletons + empty + error everywhere; labels, focus rings, contrast ≥ 4.5:1; `formatINR` everywhere (no raw paise). Fix kit bugs for P4/P5 promptly. **Concurrency demo (T+135) with P1:** two browser windows buy the last 10 units of "Retail Shop, Koramangala" — one success, one "Only N units remain" with the selector clamped.

## Load management (you carry the most pages)
Priority order: Task 1 → 2 → 4 → 5 → 6 → 7 → 8 → 3 polish → 9. **If behind at T+95, hand off `/investor/kyc` and `/notifications` to P1** (explicit ownership transfer in chat + commit message). Never cut: kit, layouts, marketplace, detail, invest checkout, dashboard, portfolio, wallet.

## Acceptance checklist
- [ ] Kit + `DashboardLayout(nav)` pushed by T+20 and signature-compatible with §9; P4/P5 are unblocked
- [ ] `DashboardLayout` has zero role-specific page knowledge; investor wallet chip refreshes after invest/top-up
- [ ] Marketplace filters survive reload (URL-synced); empty/loading/error states present
- [ ] Invest: can't exceed remaining/cap, disabled while pending, shortfall message, 409 handled
- [ ] `fresh@demo.com` dashboard/portfolio look good with zero data
- [ ] Footer disclaimer on public + dashboard layouts

## How to prompt your AI
Example: *"Read SPEC.md and 00_TEAM_CONTEXT.md. Set up shadcn/ui + Tailwind tokens (Task 1), then create the shared components in `components/shared` with the exact props from §9 — DataTable, StatusChip, FundingBar, StatCard, EmptyState, ErrorState, ConfirmModal, Pagination, Money, and chart wrappers. Do not create pages."* Push, tell P4 + P5, then one task per prompt.
