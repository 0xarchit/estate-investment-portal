# 04 — FRONTEND 2 (P4): ADMIN MODULE (isolated admin slice)

> Paste into your AI session **after** `00_TEAM_CONTEXT.md` and `SPEC.md`.
> You are **P4 (Frontend 2)**. You own the **entire `/admin/**` area** as a self-contained slice: your own layout, nav, API file, components and pages. Nothing outside the admin slice depends on your code, and you never edit anyone else's.

## Your role
Admin dashboard, property approvals and lifecycle actions, **record sale with payout preview**, users, KYC queue, withdrawals, settings. Rubric weight: Dashboards (admin KPIs and queues, part of 10), Payout UI (part of 15), Property lifecycle UI (part of 15), UI/UX (10).

## Files you OWN (touch nothing else)
`app/admin/**` (layout.tsx, every page, `loading.tsx`), `components/admin/**` (including `components/admin/nav.ts`), `lib/api/admin.ts`.

## Files you must NOT touch
Everything in `components/ui|shared|property|layout`, `lib/api/client.ts`, `lib/format.ts`, `lib/types.ts` (P3 — need a type or kit change? message P3 with the exact change); `lib/auth/**` (P5); `app/investor/**`, `app/properties/**` (P3); `app/broker/**` (P5); backend (P1/P2). **Never import from `components/investor` or `components/broker`.**

## You consume (P3 pushes the kit by ~T+20; until then use shadcn defaults + local placeholders, swap later)
`api`/`unwrap`; `formatINR`, `formatCompactINR`, `formatPct`, `formatDate`; `<StatCard/> <PageHeader/> <DataTable/> <Pagination/> <StatusChip/> <FundingBar/> <EmptyState/> <ErrorState/> <ConfirmModal/> <Money/> <PageSkeleton/>`; charts `<DonutChart/> <LineAreaChart/> <BarChartH/>` from `components/shared/charts`; `<DashboardLayout nav roleLabel>`; `useAuth()` and `<RoleGuard>` from P5; types from `lib/types.ts`.

---

## TASKS — in priority order (commit after each)

### Task 0 — Your isolated shell (T+10 → T+30)
- `components/admin/nav.ts`: `export const adminNav: NavItem[]` → Dashboard `/admin`, Properties `/admin/properties`, Users `/admin/users`, KYC `/admin/kyc`, Withdrawals `/admin/withdrawals`, Settings `/admin/settings` (lucide icons).
- `app/admin/layout.tsx`: `<RoleGuard roles={['ADMIN']}><DashboardLayout nav={adminNav} roleLabel="Admin">{children}</DashboardLayout></RoleGuard>` (until P3/P5 push those, stub locally and swap).
- `lib/api/admin.ts`: typed functions with `unwrap` for **every** call you use (§7): `getAdminStats, getProperties (admin sees all), approveProperty, rejectProperty, setPropertyStatus, previewPayout, sellProperty, getAdminUsers, patchUser, getAdminKyc, reviewKyc, getWithdrawals, reviewWithdrawal, getSettings, patchSettings`.
- Admin-only helpers live in `components/admin/` (e.g. `RejectModal`, `PayoutTable`, `QueueCard`, `UserRowActions`).

### Task 1 — Admin dashboard `/admin` (T+25 → T+55) ⭐ P0
Data: `GET /admin/stats`.
- KPI cards: **AUM**, **Total users** (Admin/Broker/Investor breakdown), **Live properties**, **Funds raised this month**, **Platform fees earned** (`formatCompactINR`).
- Charts: **Funds raised over time** (`LineAreaChart`, last 30 days) and **Properties by status** (`BarChartH` or `DonutChart`, status colours).
- **Approval queues**: pending properties → `/admin/properties?status=PENDING_APPROVAL`, pending KYC → `/admin/kyc`, unapproved brokers → `/admin/users?role=BROKER`, pending withdrawals → `/admin/withdrawals`; show counts, "Review" links, first few pending properties inline with quick Approve/Reject if time.
- Skeletons while loading, error state with retry.

### Task 2 — Admin properties `/admin/properties` (T+50 → T+85) ⭐ P0 lifecycle
`GET /properties` (admin token returns all statuses). `DataTable`: property (image/title/city), broker, status chip, funding %, valuation, created. Filters: status (all 8), broker, city, search; pagination; URL-synced (`?status=`).
Row actions — show only legal ones (the **backend is the real guard**; surface 403/409 as toasts):
- PENDING_APPROVAL → **Approve** (`ConfirmModal`) / **Reject** (modal, required reason textarea, min 5 chars, zod)
- LIVE → **Cancel & refund** (danger `ConfirmModal`: "Refund every investor in full to wallet. This cannot be undone.") → `POST /properties/:id/status {status:'CANCELLED'}`
- FUNDED → **Move to HOLDING** (`ConfirmModal`)
- HOLDING → **Record sale** → `/admin/properties/[id]/sell`
- Any → **View** (link to public `/properties/[id]`)
Loading buttons while pending, toasts on success, invalidate `['properties']` + `['admin','stats']`.

### Task 3 — Record sale `/admin/properties/[id]/sell` (T+80 → T+110) ⭐⭐ rubric-critical
Only valid for HOLDING; otherwise show "Sale can only be recorded for properties in HOLDING" (and an "Already sold" state for SOLD).
- Property summary card (title, valuation, units, investors, status).
- **Sale price input in ₹** (Indian grouping while typing; convert to integer paise: `Math.round(rupees*100)`), validated > 0. Debounced (400 ms) `GET /properties/:id/payout-preview?salePrice=<paise>`.
- **Fee preview:** sale price, platform fee (% from response, shown negative), **Distributable amount**.
- **Payout preview table per investor:** investor, units, ownership %, invested, payout, ROI % (**negative ROI red with minus sign**, positive emerald, never colour alone), totals row, and a visible check line **"Sum of payouts = distributable ✓"** (compare items to `distributable`; flag a mismatch loudly). Loss case (sale < valuation) allowed with an info note.
- **Confirm** → `ConfirmModal` (total payout, investor count) → `POST /properties/:id/sell {salePrice}`; button disabled while pending (double-click safe); on `409 ALREADY_SOLD` show "This property was already sold — no payout was repeated" and refresh. Success screen with payout summary and link back.

### Task 4 — Users `/admin/users` (T+100 → T+115) ⭐ P0 (ADM-2)
Search, role filter, active filter (URL-synced), `DataTable`: role chip, brokerApproved, KYC status, active `Switch` (+ `ConfirmModal`), **Approve broker** button, link to KYC. Own row disabled (backend also blocks). Pagination, empty/loading/error states.

### Task 5 — KYC queue, withdrawals, settings (T+110 → T+135)
- `/admin/kyc`: pending queue with **document preview** (image thumbnail / PDF link in a dialog), Approve / Reject (reason required).
- `/admin/withdrawals`: pending list (user, amount, dummy bank details), Approve / Reject (reason) with confirm; surface `INSUFFICIENT_BALANCE` as a toast.
- `/admin/settings`: platform fee %, broker commission %, max ownership % per investor (zod ranges 0–20, 0–10, 1–100) → `PATCH /admin/settings`, saved state feedback.

### Task 6 — Polish (T+135 → T+145)
Loading / empty / error / success on every screen; 360px / tablet / desktop, no horizontal scroll; focus rings, labels, contrast ≥ 4.5:1; `formatINR` everywhere.

## Cut order if time runs short (drop from the bottom)
Settings → withdrawals → KYC queue polish → users polish. **Never cut:** dashboard, properties (approve/reject/status), record sale, users.

## Acceptance checklist
- [ ] Record sale: preview updates as price changes; totals equal distributable; confirm is double-click safe; `409 ALREADY_SOLD` handled
- [ ] Seeded HOLDING example at ₹1,40,00,000 shows Aman ₹2,74,400 and ROI 37.2%
- [ ] Only legal actions per status are shown; backend errors surface as toasts
- [ ] Negative ROI red with minus sign + text, positive emerald
- [ ] Zero imports from other role slices; layout is the one-liner pattern with `adminNav`

## Demo accounts (from seed)
`admin@demo.com / Admin@123`. Investors for testing payouts: `aman@demo.com`, `priya@demo.com`, `karan@demo.com` / `Investor@123`.

## How to prompt your AI
Example: *"Read SPEC.md and 00_TEAM_CONTEXT.md. Build `/admin/properties/[id]/sell` per Task 3 using `previewPayout` and `sellProperty` from `lib/api/admin.ts` and the shared `DataTable`, `ConfirmModal`, `formatINR`. Convert rupees to integer paise before calling the API; show the sum check; disable confirm while pending. Only touch files under `app/admin` and `components/admin`."* One page per prompt; review the diff; test on the seeded HOLDING property; commit (`feat(admin): record sale with payout preview`).
