# 00 — TEAM CONTEXT (every person pastes this + their own role file + SPEC.md into every AI session)

> Project: **Fractional Real Estate Investment Portal** (W3Grads PS1). 5 people, **150 minutes**, Next.js (App Router) + MongoDB Atlas + Mongoose.
> `SPEC.md` = the full problem statement text (commit it to the repo root at minute 0).
> **Prime directive for the AI:** do ONLY the tasks in my role file, touch ONLY the files I own, and follow the contracts below exactly. If something I need is owned by someone else, code against the contract, never edit their file.

---

## 1. Team & roles (fill in names)

| ID | Name | Role | Prompt file | Owns |
|----|------|------|-------------|------|
| P1 | ____ | **Backend 1 — Core** | `01_BACKEND_1_CORE.md` | Scaffold + deps, DB, ALL models, auth API, handler helpers, ledger, settings, notifications helper, uploads, property lifecycle, `invest()` engine, cancel/refund, PROMPTS.md merge |
| P2 | ____ | **Backend 2 — Money & Admin APIs** | `02_BACKEND_2_MONEY_ADMIN.md` | Payout (preview/execute/sell), wallet + mock top-up + withdrawals, transactions, portfolio, admin/broker APIs, notifications endpoints, **seed script**, README, API docs |
| P3 | ____ | **Frontend 1 — Main UI + Investor** | `03_FRONTEND_1_MAIN_UI_INVESTOR.md` | Design system, shared component kit + chart wrappers, API client/types/formatters, `DashboardLayout` + `PublicLayout`, landing, marketplace, property detail, 403/404, **entire `/investor/**` module** (dashboard, portfolio, invest checkout, wallet, KYC), `/notifications` |
| P4 | ____ | **Frontend 2 — Admin** | `04_FRONTEND_2_ADMIN.md` | **Entire `/admin/**` module** (own layout, nav, API file, components, pages) |
| P5 | ____ | **Frontend 3 — Broker + Auth** | `05_FRONTEND_3_BROKER_AUTH.md` | `AuthContext`, `RoleGuard`, login/signup/profile, **entire `/broker/**` module** (own layout, nav, API file, components, pages) |

### Isolation principle (frontend)
Each role's UI is a **vertical slice** that only its owner edits:

| Slice | Pages | Layout | Nav | API file | Components |
|-------|-------|--------|-----|----------|------------|
| Investor (P3) | `app/investor/**` | `app/investor/layout.tsx` | `components/investor/nav.ts` | `lib/api/{investments,wallet,portfolio,kyc,notifications}.ts` | `components/investor/**` |
| Admin (P4) | `app/admin/**` | `app/admin/layout.tsx` | `components/admin/nav.ts` | `lib/api/admin.ts` | `components/admin/**` |
| Broker (P5) | `app/broker/**` | `app/broker/layout.tsx` | `components/broker/nav.ts` | `lib/api/broker.ts` | `components/broker/**` |

The ONLY things slices share (read-only imports): P3's kit (`components/ui|shared|property|layout`, `lib/api/client.ts`, `lib/format.ts`, `lib/types.ts`) and P5's auth (`lib/auth/**`). A slice never imports from another slice. Every role layout is the same one-liner: `<RoleGuard roles={['X']}><DashboardLayout nav={xNav} roleLabel="X">{children}</DashboardLayout></RoleGuard>`.

**Rule of ownership:** a file has exactly one owner. Never edit a file you don't own. Need a change? Message the owner with the exact change. Emergency exception: tiny fix, say so in the commit message, tell the owner.

## 2. Timeline (T = minutes from start)

| T | Milestone | Owner |
|---|-----------|-------|
| 0–8 | Create repo, add all 5 collaborators, push `create-next-app`, **install ALL deps**, `.env.example`, `SPEC.md`, this `prompts/` folder | P1 |
| 8–15 | **P1 pushes:** db connect, all models, `ApiError`, `ok()`, `route()` wrapper, `ledger.post` | P1 |
| 8–20 | **P3 pushes the KIT:** shadcn init, tokens, `lib/format.ts`, `lib/api/client.ts`, `lib/types.ts`, shared component + chart stubs (agreed props), `DashboardLayout` + `PublicLayout` | P3 |
| 0–25 | **P5 pushes auth:** `AuthContext`, `useAuth`, `RoleGuard`, `roleHome`, `GuestOnly` (everyone's layouts import it) | P5 |
| 15–25 | P1 pushes auth routes + `authenticate`/`requireRole` | P1 |
| 20–35 | P4 and P5 each push their own `layout.tsx` + `nav.ts` + empty page stubs; P3 pushes investor layout + nav | P3, P4, P5 |
| 0–25 | P2 builds the *pure* payout calculator + unit test (no deps) | P2 |
| 45 | **Seed script runs** (admin, broker, investors, 8 properties) | P2 |
| 100 | **Core flow works E2E** (create → approve → marketplace → invest → FUNDED) | all |
| 125 | **Feature freeze.** Only bug fixes, empty/loading/error states | all |
| 135 | Concurrency proof + demo video recorded | P1 + P3 |
| 140–148 | README (P2), `PROMPTS.md` merge (P1), final deploy, submit | P1, P2 |

If a dependency isn't pushed yet: build against the contract with local mock data in YOUR OWN files, swap later. Never block, never edit others' files. **Backend people (P1, P2) finish early** — after T+105 they act as testers/helpers; if a frontend owner is behind they can formally take over one named page (ownership is transferred explicitly in chat + commit message).

## 3. Stack & shared conventions

- Next.js 14+ App Router, **TypeScript**, Route Handlers under `app/api/v1/**` (same API contract as the PS).
- Backend libs: `mongoose`, `zod`, `bcryptjs`, `jsonwebtoken`, `cloudinary`, `uuid`.
- Frontend libs: `tailwindcss`, `shadcn/ui`, `@tanstack/react-query`, `axios`, `react-hook-form` + `@hookform/resolvers`, `recharts`, `react-hot-toast`, `lucide-react`, `framer-motion`, `swiper` (optional).
- **Money = integer paise everywhere** (₹1 = 100). Never floats in DB or API. Only UI formats to rupees (`formatINR`). Estimates (projected value) may use float math but are rounded to integer paise before returning.
- IDs are strings in API (`_id`), dates ISO strings, roles `ADMIN | BROKER | INVESTOR`.
- Auth: `Authorization: Bearer <jwt>`; frontend stores the token in `localStorage` key **`fre_token`**. JWT payload `{ sub: userId, role }`, expires `1d`.
- **Success:** `{ success: true, data, message? }` — **Error:** `{ success: false, error: { code, message, details? } }`.
- **List data:** `{ items, page, limit, total, totalPages }`. Query: `?page=1&limit=20&sort=-createdAt&search=`.
- **Error codes → HTTP:** `VALIDATION_ERROR` 400, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `TOO_MANY_REQUESTS` 429, `INTERNAL_ERROR` 500; domain: `INSUFFICIENT_UNITS` 409, `INSUFFICIENT_BALANCE` 400, `KYC_NOT_APPROVED` 403, `PROPERTY_NOT_LIVE` 409, `BELOW_MIN_UNITS` 400, `MAX_OWNERSHIP_EXCEEDED` 409, `ALREADY_SOLD` 409, `INVALID_TRANSITION` 409, `DUPLICATE_PAYMENT` 409, `DUPLICATE_REQUEST` 409, `BROKER_NOT_APPROVED` 403, `LOCKED_FIELDS` 403.
- Status chip colours (PS): DRAFT grey, PENDING_APPROVAL amber, LIVE blue, FUNDED emerald, HOLDING purple, SOLD navy, REJECTED red, CANCELLED slate. Never colour alone — always show text.
- Palette: Navy `#0F2A4A`, Emerald `#10B981`, Gold `#D4A017`, bg `#F7F8FA`, surface `#FFFFFF`, danger `#DC2626`, warning `#F59E0B`, text `#111827`, muted `#6B7280`.

## 4. Repo layout & FILE OWNERSHIP

```
app/
  layout.tsx, globals.css, page.tsx (landing)            P3
  properties/page.tsx, properties/[id]/page.tsx          P3
  403/page.tsx, not-found.tsx                            P3
  notifications/page.tsx                                 P3
  login/ signup/ forgot-password/ reset/[token]/ profile/   P5
  investor/** (layout, dashboard, portfolio, invest/[id], wallet, kyc)   P3
  admin/** (layout + all pages + loading.tsx)            P4
  broker/** (layout + all pages + loading.tsx)           P5
  api/v1/auth/**, uploads/**                             P1
  api/v1/properties/route.ts, [id]/route.ts, [id]/submit|approve|reject|status|investors   P1
  api/v1/investments/route.ts (POST)                     P1
  api/v1/properties/[id]/sell, [id]/payout-preview       P2
  api/v1/investments/me, portfolio/**, wallet/**, transactions, admin/**, kyc, broker/**, notifications/**   P2
components/ui/**, shared/** (incl. shared/charts), property/**, layout/**   P3   (kit — read-only for others)
components/investor/**                                   P3
components/admin/**                                      P4
components/auth/**, components/broker/**                 P5
lib/api/client.ts, properties.ts, investments.ts, wallet.ts, portfolio.ts, kyc.ts, notifications.ts   P3
lib/api/admin.ts                                         P4
lib/api/auth.ts, broker.ts                               P5
lib/auth/AuthContext.tsx, RoleGuard.tsx                  P5
lib/format.ts, lib/types.ts, lib/calc.ts                 P3
lib/validators/auth|property|investment.ts               P1   (shared zod; frontends may import)
lib/validators/wallet|admin|kyc.ts                       P2
lib/server/config|db|errors|handler|http|rateLimit|auth/**, models/**   P1
lib/server/services/{ledger,settings,notification,property,investment}.service.ts   P1
lib/server/services/{payout,wallet,portfolio,stats}.service.ts   P2
scripts/seed.ts, docs/**, README.md                      P2
scripts/concurrency-test.ts, PROMPTS.md                  P1
package.json, .env.example, next.config.*                P1 (images remotePatterns for picsum.photos, res.cloudinary.com added at T+8)
tailwind.config, components.json                         P3
```

Everyone keeps their own prompt log in `prompts-log/pN.md` (paste key prompt + one-line result). P1 merges into `PROMPTS.md` at T+140.

## 5. Data contracts (Mongoose models owned by P1; field names are FIXED)

**User** `{ _id, name, email(lowercase unique), phone, passwordHash(select:false), role, isActive=true, brokerApproved=false, walletBalance=0 (paise; changed ONLY via ledger.post), kyc:{ status:'NOT_SUBMITTED|PENDING|APPROVED|REJECTED', docs:[{url,name}], reason }, createdAt, updatedAt }`

**Property** `{ _id, title, description, type:'APARTMENT|VILLA|COMMERCIAL|PLOT|WAREHOUSE', address, city, state, pincode, geo:{lat,lng}, areaSqft, images:[{url,publicId,name}], documents:[{url,publicId,name}], valuation(paise), totalUnits, unitPrice(paise, = valuation/totalUnits exact), minUnits, maxUnitsPerInvestor, unitsSold=0, expectedAppreciationPct, rentalYieldPct, holdingPeriodMonths, status, rejectionReason, brokerId, approvedBy, salePrice, soldAt, fundedAt, liveAt, cancelledAt, createdAt, updatedAt }`
API adds computed: `fundingPct` (0–100, 2dp), `remainingUnits`, `investorCount`, `broker:{ _id, name }`.

**Investment** `{ _id, investorId, propertyId, units, amount(paise), status:'ACTIVE|EXITED|REFUNDED', payoutAmount, idempotencyKey(unique sparse), createdAt }` — one doc per purchase; holdings = aggregate by (investorId, propertyId).

**Transaction (ledger, append-only)** `{ _id, userId, type:'TOPUP|INVESTMENT|PAYOUT|REFUND|COMMISSION|WITHDRAWAL|FEE', direction:'CREDIT|DEBIT', amount(>0 paise), balanceAfter, refType, refId, gatewayPaymentId(unique sparse), note, createdAt }`

**Payout** `{ _id, propertyId(unique), salePrice, platformFee, distributable, items:[{investorId, units, amount}], executedBy, executedAt }`
**Withdrawal** `{ _id, userId, amount, status:'PENDING|APPROVED|REJECTED', bankDetails:{accountName, accountNumber(dummy), ifsc}, reason, processedBy, createdAt }`
**Notification** `{ _id, userId, type, title, body, link, read=false, createdAt }`
**Settings** (single doc) `{ platformFeePct=2, brokerCommissionPct=1, maxOwnershipPct=49 }`

## 6. Property status machine (P1 in `property.service.ts`, used by P2)

`DRAFT→PENDING_APPROVAL` (owner broker/admin, needs required fields + ≥3 images) · `PENDING_APPROVAL→LIVE|REJECTED` (admin; reject needs reason) · `REJECTED→PENDING_APPROVAL` (owner broker) · `LIVE→FUNDED` (system, unitsSold===totalUnits) · `LIVE→CANCELLED` (admin, refund all) · `FUNDED→HOLDING` (admin) · `HOLDING→SOLD` (admin via `/sell`). Anything else → `409 INVALID_TRANSITION`.

## 7. API contract (all under `/api/v1`) — **Fe** = which frontend slice consumes it

| Method | Path | Owner | Access | Request → Response (key fields) | Fe |
|---|---|---|---|---|---|
| POST | /auth/register | P1 | public | `{name,email,phone,password,role:'INVESTOR'|'BROKER'}` → `{ user }` (201) | P5 |
| POST | /auth/login | P1 | public | `{email,password}` → `{ token, user }` | P5 |
| POST | /auth/logout | P1 | auth | → `{}` | P5 |
| GET | /auth/me | P1 | auth | → `{ user }` (walletBalance, kyc, brokerApproved) | P5 |
| POST | /auth/change-password | P1 | auth | `{currentPassword,newPassword}` | P5 |
| POST | /uploads | P1 | auth | multipart `file` (jpg/png/webp/pdf ≤5MB) → `{ url, publicId, name }` | P3,P5 |
| GET | /properties | P1 | public (token optional) | `city,type,minPrice,maxPrice(per unit, paise),status,search,minFunding,maxFunding,sort,page,limit`. Public/investor sees only LIVE/FUNDED (+HOLDING/SOLD if asked); admin token sees all | P3,P4 |
| GET | /properties/:id | P1 | public for LIVE+; owner/admin otherwise | → Property (+computed) | P3,P4,P5 |
| POST | /properties | P1 | BROKER(approved)/ADMIN | create DRAFT (201) | P5 |
| PATCH | /properties/:id | P1 | owner broker / admin | rules per status; `LOCKED_FIELDS` 403 | P5 |
| POST | /properties/:id/submit | P1 | owner broker/admin | → PENDING_APPROVAL | P5 |
| POST | /properties/:id/approve | P1 | ADMIN | → LIVE | P4 |
| POST | /properties/:id/reject | P1 | ADMIN | `{reason}` → REJECTED | P4 |
| POST | /properties/:id/status | P1 | ADMIN | `{status:'HOLDING'|'CANCELLED'}` (refunds on cancel) | P4 |
| GET | /properties/:id/investors | P1 | owner broker/admin | `{ items:[{investorId,name,units,amount,ownershipPct}] }` (broker: initials) | P4,P5 |
| POST | /investments | P1 | INVESTOR | `{propertyId, units, idempotencyKey?}` → `{ investment, property:{unitsSold,fundingPct,status}, walletBalance }` (201) | P3 |
| GET | /properties/:id/payout-preview?salePrice= | P2 | ADMIN | → `{ salePrice, platformFee, platformFeePct, distributable, items:[{investorId,name,units,ownershipPct,invested,amount,roiPct}], remainder, sumCheck }` (paise) | P4 |
| POST | /properties/:id/sell | P2 | ADMIN | `{salePrice}` → `{ payout }`; second call `409 ALREADY_SOLD` | P4 |
| GET | /investments/me | P2 | INVESTOR | → `{ items:[{ propertyId, property:{title,city,image,status,unitPrice,expectedAppreciationPct}, units, ownershipPct, invested, estimatedValue, payoutReceived, roiPct, status }] }` | P3 |
| GET | /portfolio/summary | P2 | INVESTOR | → `{ totalInvested, currentValue, totalPayouts, roiPct, walletBalance, allocation:[{propertyId,title,amount}], recentTransactions }` | P3 |
| GET | /wallet | P2 | INVESTOR | → `{ balance }` | P3 |
| POST | /wallet/topup/order | P2 | INVESTOR | `{amount}` → `{ orderId, amount, mock:true, mockPayment:{ paymentId, signature } }` | P3 |
| POST | /wallet/topup/verify | P2 | INVESTOR | `{orderId,paymentId,signature}` → `{ balance }`; replay → 409 `DUPLICATE_PAYMENT` | P3 |
| POST | /wallet/withdraw | P2 | INVESTOR | `{amount, bankDetails}` → Withdrawal (PENDING) | P3 |
| GET | /wallet/withdrawals | P2 | INVESTOR | own withdrawals | P3 |
| GET | /transactions | P2 | auth | own (admin: all). `type,from,to,direction,page,limit` | P3,P4 |
| POST | /kyc | P2 | INVESTOR | `{docs:[{url,name}]}` → PENDING | P3 |
| GET | /admin/kyc?status=PENDING | P2 | ADMIN | list `{ userId, name, email, kyc }` | P4 |
| PATCH | /admin/kyc/:userId | P2 | ADMIN | `{action:'APPROVE'|'REJECT', reason?}` | P4 |
| GET | /admin/stats | P2 | ADMIN | → `{ kpis:{aum,totalUsers,usersByRole,liveProperties,fundsRaisedThisMonth,platformFeesEarned}, charts:{fundsRaisedOverTime:[{date,amount}], propertiesByStatus:[{status,count}]}, queues:{pendingProperties,pendingKyc,pendingBrokers,pendingWithdrawals} }` | P4 |
| GET/PATCH | /admin/users[/:id] | P2 | ADMIN | `search,role,isActive,page,limit` / `{isActive?,role?,brokerApproved?}` | P4 |
| GET/PATCH | /admin/withdrawals[/:id] | P2 | ADMIN | PATCH `{action:'APPROVE'|'REJECT',reason?}` | P4 |
| GET/PATCH | /admin/settings | P2 | ADMIN | `{platformFeePct,brokerCommissionPct,maxOwnershipPct}` | P4 |
| GET | /broker/properties | P2 | BROKER | own listings with `fundingPct, investorCount, commissionEarned` | P5 |
| GET | /broker/stats | P2 | BROKER | `{ listed, live, funded, totalRaised, commissionEarned, pendingApprovals, fundingByProperty:[{title,fundingPct}] }` | P5 |
| GET | /broker/properties/:id/funding-timeline | P2 | owner broker | `[{ date, unitsSold }]` cumulative | P5 |
| GET | /notifications | P2 | auth | `{ items, unreadCount }` | P3 (bell + page) |
| PATCH | /notifications/:id/read, /notifications/read-all | P2 | auth | | P3 |

## 8. Cross-person service contracts (backend)

```ts
// P1 — lib/server/handler.ts
export const GET = route({ auth: true, roles: ['ADMIN'] }, async ({ req, user, params, query, body }) => ok(data, 'msg'))
//  options: { auth?: boolean (default true), optionalAuth?: boolean, roles?: Role[], rateLimit?: 'auth'|'invest', schema?: ZodSchema }
//  connects DB, verifies JWT, loads user, 401 if missing/inactive, 403 if role not allowed, maps ApiError/ZodError/unknown → standard error JSON (no stack traces)
export class ApiError { constructor(status:number, code:string, message:string, details?:any) }
export const ok = (data, message?, status=200) => NextResponse

// P1 — ledger.service.ts  (ONLY way to move money / change walletBalance)
ledger.post({ userId, type, direction, amount, refType?, refId?, gatewayPaymentId?, note?, session? }) : Promise<Transaction>
//  CREDIT → $inc walletBalance; DEBIT → conditional update { walletBalance: { $gte: amount } } else ApiError(400,'INSUFFICIENT_BALANCE'); writes balanceAfter. Accepts a mongoose ClientSession.
ledger.getBalance(userId, session?) : Promise<number>
// P1 — settings.service.ts      getSettings(session?) : { platformFeePct, brokerCommissionPct, maxOwnershipPct }
// P1 — notification.service.ts  notify(userId, { type, title, body, link? }, session?)
// P1 — property.service.ts      assertTransition(from,to) ; serializeProperty(doc, extras?)
// P2 — payout.service.ts        computePayout({ salePrice, platformFeePct, totalUnits, holders }) PURE BigInt ; previewPayout(...) ; executePayout(...)
```

## 9. Frontend shared contracts

```ts
// P5 — lib/auth/AuthContext.tsx
useAuth(): { user: User|null, token: string|null, loading: boolean,
             login(email,password): Promise<User>, register(data): Promise<User>,
             logout(): void, refreshUser(): Promise<void> }
<AuthProvider>{children}</AuthProvider>     // mounted in app/layout.tsx by P3
<RoleGuard roles={['ADMIN']}>{children}</RoleGuard>   // no token → /login?next=…, wrong role → /403
<GuestOnly>{children}</GuestOnly>           // logged-in users → roleHome(role)
roleHome(role): '/admin' | '/broker' | '/investor'

// P3 — lib/api/client.ts
api (axios, baseURL '/api/v1', attaches Bearer fre_token, 401 → clear token + /login)
unwrap<T>(promise): Promise<T>              // returns res.data.data ; throws { code, message, details, status } on error

// P3 — lib/format.ts
formatINR(paise:number): string        // ₹1,00,00,000  (Intl en-IN, divides by 100)
formatCompactINR(paise:number): string // ₹1.4 Cr / ₹25 L / ₹5,000
formatPct(n:number, dp=1): string ; formatDate(iso): string

// P3 — components/layout (every role layout.tsx uses this)
type NavItem = { label: string; href: string; icon?: LucideIcon }
<DashboardLayout nav={NavItem[]} roleLabel="Admin|Broker|Investor">{children}</DashboardLayout>
//  sidebar from `nav`; top bar: page title, wallet chip (shown automatically when user.role==='INVESTOR'), notifications bell (/notifications API), avatar menu (Profile → /profile, Logout); footer disclaimer
<PublicLayout>{children}</PublicLayout>

// P3 — components/shared (stubs with these props pushed by T+20)
<StatusChip status="LIVE" />          <FundingBar pct={47} />          <Money paise={..} compact? signed? />
<StatCard label value hint? icon? tone? loading? />      <PageHeader title subtitle? actions? />
<EmptyState title description? action? />                <ErrorState message onRetry? />
<ConfirmModal open title description confirmLabel tone? loading onConfirm onClose />
<DataTable columns={[{key,header,sortable?,align?,render?(row)}]} rows loading emptyTitle? page totalPages onPageChange sort? onSortChange? onRowClick? />
<Pagination page totalPages onChange />     <PropertyCard property />     <PageSkeleton />
// P3 — components/shared/charts
<DonutChart data={[{name,value}]} centerLabel? />   <LineAreaChart data xKey yKey format? />   <BarChartH data={[{label,value}]} format? />
```
Query keys: `['properties', filters]`, `['property', id]`, `['me']`, `['portfolio']`, `['wallet']`, `['admin','stats']`, `['broker','stats']`, `['notifications']`.

## 10. Demo data (P2's seed — frontends may rely on these)

Admin `admin@demo.com / Admin@123` · Broker `rohit@demo.com / Broker@123` (approved), `newbroker@demo.com / Broker@123` (NOT approved) · Investors `aman@demo.com`, `priya@demo.com`, `karan@demo.com`, `neha@demo.com`, `vikram@demo.com` / `Investor@123` (KYC approved, wallets funded), `fresh@demo.com / Investor@123` (KYC NOT_SUBMITTED, ₹0 wallet — for empty states).
Properties (8+): LIVE "2BHK, Sector 150, Noida" (₹1 Cr, 1000 units, 470 sold) · LIVE "Retail Shop, Koramangala" (**exactly 10 units remaining** — concurrency demo) · FUNDED · HOLDING · SOLD (with payout) · PENDING_APPROVAL · REJECTED (with reason) · DRAFT.

## 11. Git rules

- Branches: `p1/core`, `p2/money`, `p3/main-investor`, `p4/admin`, `p5/broker-auth`. **Commit small & often** (`feat(invest): atomic unitsSold update`). **Everyone must commit from their own GitHub account.**
- Merge to `main` via PR or `git pull --rebase origin main && git push` at least every 20 min; never force-push main. Pull before starting each task. Because slices are isolated, merge conflicts should be near zero — if you get one in a file you don't own, you edited the wrong file.
- No secrets in git. `.env` ignored; `.env.example` complete with one-line comments.
- Footer on every public + dashboard layout (P3): *"This is an academic project. No real money or securities are involved."*

## 12. Viva reminder
Each member must be able to explain every line they commit. AI output you can't explain = zero marks. After each AI generation: read the diff, run it, test one unhappy path, then commit.

## 13. Final demo checklist (record in this order)
1. Rohit registers → admin approves broker → Rohit creates + submits listing 2. Admin approves → LIVE 3. Aman signs up → KYC → admin approves → top-up 4. Invest ₹2,00,000 (20 units = 2%) 5. Funding to 100% → FUNDED + commission 6. Admin → HOLDING 7. Record sale ₹1,40,00,000 with payout preview → Aman gets ₹2,74,400 (ROI 37.2%) 8. Concurrency: two browser windows buy last 10 units → one succeeds, one gets 409 9. Investor token calling an admin API → 403.
