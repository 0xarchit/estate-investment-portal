# 05 — FRONTEND 3 (P5): AUTH & BROKER MODULE (isolated broker slice)

> Paste into your AI session **after** `00_TEAM_CONTEXT.md` and `SPEC.md`.
> You are **P5**. Follow the contracts in `00_TEAM_CONTEXT.md` exactly. You build the auth plumbing every other page depends on (push by **T+25**), then the entire broker area. The broker module is a self-contained slice: your own layout, nav, API file, components and pages — nothing else in the app depends on it.

## Your role
Own `AuthContext` + route guards (everyone depends on them — push by **T+25**), the login/signup/profile pages, and the full `/broker/**` module. Rubric weight you carry: Auth & RBAC UI (part of 15), Property lifecycle wizard (part of 15), Broker dashboard (part of 10), UI quality (10).

## Files you OWN (touch nothing else)
`lib/auth/AuthContext.tsx`, `lib/auth/RoleGuard.tsx`, `lib/api/auth.ts`, `lib/api/broker.ts`, `app/login/**`, `app/signup/**`, `app/forgot-password/**`, `app/reset/[token]/**`, `app/profile/**`, **`app/broker/**` (layout.tsx + all pages + loading.tsx)**, `components/auth/**`, `components/broker/**` (including `components/broker/nav.ts` and any broker-only charts).

## Files you must NOT touch
anything in `components/shared|ui|layout|property`, `lib/api/client.ts`, `lib/format.ts`, `lib/types.ts` (all P3 / Frontend 1 — need a change? message P3), `app/investor/**` (P3), `app/admin/**` (P4), backend files (P1/P2).

## You consume (P3 (Frontend 1) pushes by ~T+20; until then use shadcn defaults + local placeholders, swap later)
`api`/`unwrap` from `lib/api/client.ts`, `formatINR`, `formatCompactINR`, `<StatusChip/> <FundingBar/> <StatCard/> <PageHeader/> <EmptyState/> <ErrorState/> <ConfirmModal/> <DataTable/> <Pagination/> <PageSkeleton/>` and `lib/types.ts`. Shared zod schemas from `lib/validators/auth.ts` and `lib/validators/property.ts` (P1).

---

## TASKS (in order; commit after each)

### Task 0 — Your isolated broker shell (T+20 → T+30, once P3 pushes `DashboardLayout`)
- `components/broker/nav.ts`: `export const brokerNav: NavItem[] = [Dashboard /broker, My properties /broker/properties, New listing /broker/properties/new]` (icons from lucide-react).
- `app/broker/layout.tsx`: `<RoleGuard roles={['BROKER']}><DashboardLayout nav={brokerNav} roleLabel="Broker">{children}</DashboardLayout></RoleGuard>` (props contract in §9). Wallet chip is investor-only and handled inside `DashboardLayout`.
- `lib/api/broker.ts`: typed functions for every broker call (`getBrokerStats, getBrokerProperties, createProperty, patchProperty, submitProperty, getFundingTimeline, getPropertyInvestors, uploadFile`).

### Task 1 — Auth plumbing (T+0 → T+25, PUSH ASAP — P3's layouts and everyone's guards import this)
- `lib/auth/AuthContext.tsx`: provider storing `token` in `localStorage['fre_token']`; on mount, if token → `GET /auth/me`; exposes exactly `useAuth(): { user, token, loading, login, register, logout, refreshUser }` (§9). `login` stores token + user and returns user; `logout` clears token, clears React Query cache, goes to `/login`. `app/layout.tsx` is P3's — export `AuthProvider` and ask P3 to mount it (with QueryClientProvider and Toaster).
- `lib/auth/RoleGuard.tsx`: `<RoleGuard roles={[...]}>`: while `loading` show skeleton; no user → `router.replace('/login?next=<path>')`; wrong role → `router.replace('/403')`; deactivated/401 handled by api client. Also export `roleHome(role)` and `<GuestOnly>` (redirects logged-in users to their dashboard).
- `lib/api/auth.ts`: `registerApi, loginApi, meApi, changePasswordApi` using `unwrap`.

### Task 2 — Login & Signup pages (T+20 → T+45)
- `/login`: email + password, show/hide toggle, inline zod errors (react-hook-form + `zodResolver` with `lib/validators/auth.ts`), loading state on button, server error toast (`Invalid email or password`, deactivated message), redirect to `?next=` or `roleHome(role)`. Show demo credentials helper (small collapsible: admin/broker/investor) — handy for the evaluator.
- `/signup`: **Investor / Broker role toggle** (segmented control), fields: name, email, phone (10 digits), password (+ live strength checklist: 8+ chars, number, symbol), confirm password. On success: auto-login → redirect to role home. For BROKER show a note "Your account needs admin approval before you can list properties."
- Both pages wrapped in `<GuestOnly>`, responsive at 360px, clean fintech look (navy/emerald, no horizontal scroll). Stretch: `/forgot-password` and `/reset/[token]` (only if P1 ships the API).
- `/profile` (shared by all roles): shows name/email/role, change-password form (current + new + strength), toasts. Uses `useAuth().user`.

### Task 3 — Broker dashboard `/broker` (T+45 → T+70)
Data: `GET /broker/stats` (§7). Build with Recharts and P3 (Frontend 1)'s `StatCard`:
- KPI cards: Properties listed, Live, Funded, Total raised (`formatCompactINR`), Commission earned, Pending approvals.
- Funding chart per property: horizontal bar chart of `fundingByProperty` (0–100%).
- "Needs attention" panel: REJECTED properties (with reason) and DRAFTs → links to edit.
- Brokers with `brokerApproved === false`: show a prominent warning banner ("Awaiting admin approval — you can't create listings yet") and disable "New property" button. Handle API `403 BROKER_NOT_APPROVED` gracefully.
- Loading skeletons, empty state ("No properties yet — create your first listing"), error state with retry.

### Task 4 — My properties `/broker/properties` (T+60 → T+80)
`GET /broker/properties` → `<DataTable>`: columns Property (image + title + city), Status chip, Funding % (FundingBar), Units sold/total, Investors, Commission, Actions. Filters: status select, search; pagination (`page`, `limit`). Row actions by status:
- DRAFT/REJECTED → **Edit** (`/broker/properties/[id]/edit`), **Submit** (calls `POST /properties/:id/submit`, `ConfirmModal`, toast; show server validation list if <3 images/missing fields)
- REJECTED → show `rejectionReason` in an inline alert/tooltip and the **Resubmit** after editing
- PENDING_APPROVAL → View only (shows "Awaiting review")
- LIVE/FUNDED/HOLDING/SOLD → **View analytics** (`/broker/properties/[id]`)
Empty state with CTA to create.

### Task 5 — Listing wizard `/broker/properties/new` and `/broker/properties/[id]/edit` (T+70 → T+110) ⭐
One reusable `components/broker/PropertyWizard.tsx` (create + edit mode). **5 steps with a progress indicator**: Basics → Location → Financials → Media & docs → Review & submit. Single react-hook-form instance across steps, per-step zod validation (reuse `lib/validators/property.ts`), **Save as draft at any step** (POST on first save, PATCH after; keep `id` in state / URL).
- Basics: title, description, type (APARTMENT/VILLA/COMMERCIAL/PLOT/WAREHOUSE), area sq ft.
- Location: address, city, state, pincode (6 digits), lat/lng (optional, used for the map embed).
- Financials: valuation in ₹ (convert to paise on submit: `Math.round(rupees*100)`), total units, **auto-calculated read-only price/unit** = valuation / totalUnits shown live; **inline error if it doesn't divide to a whole rupee** ("Choose units so price per unit is a whole rupee"); min units, max units per investor (default shows 49% hint), expected appreciation %, rental yield %, holding period (months).
- Media & docs: drag-and-drop/multi-select upload to `POST /uploads` (client-check MIME jpg/png/webp/pdf and ≤5 MB, per-file progress + remove), **require ≥ 3 images** to enable Submit; show thumbnails; documents list.
- Review: read-only summary of everything, with Submit for approval (`POST /properties/:id/submit`) → success screen linking to My properties.
- Edit mode: loads `GET /properties/:id`; if status is LIVE+ the financial fields are read-only (backend returns `LOCKED_FIELDS`; show message). Show rejection banner with reason at top when REJECTED.
- Prevent double-submit (disable while pending), warn on unsaved leave (optional).

### Task 6 — Property analytics `/broker/properties/[id]` (T+105 → T+125)
- Header: title, status chip, funding bar, units sold, investors count, commission (if FUNDED+).
- **Funding timeline** line/area chart from `GET /broker/properties/:id/funding-timeline` (Recharts).
- **Investor list** from `GET /properties/:id/investors` (names come masked as initials from the API) — table with units, amount (`formatINR`), ownership %.
- Other broker's property → API 403/404 → render a proper 403/NotFound state, not a blank page.
- Enquiries panel: only if time and backend exists (P1/P2 are not building enquiries by default — **skip**).

### Task 7 — Polish (T+125 → T+140)
Every data screen has loading skeleton + empty + error + success feedback; test at 360px / tablet / desktop; keyboard focus rings; labels on every input; contrast ≥ 4.5:1.

## Acceptance checklist
- [ ] Refresh keeps you logged in; logout clears token and cache; wrong role on a URL → `/403`
- [ ] Signup role toggle works; ADMIN is never selectable
- [ ] Unapproved broker (`newbroker@demo.com`) sees the banner and cannot open the wizard
- [ ] Wizard: price/unit auto-calc, non-divisible case blocked, <3 images blocks submit, draft saves at every step
- [ ] Rejected property shows reason, can be edited and resubmitted
- [ ] Broker never sees another broker's data (API enforces; UI shows 403 state)

## Demo accounts (from seed)
`rohit@demo.com / Broker@123` (approved) · `newbroker@demo.com / Broker@123` (not approved) · `admin@demo.com / Admin@123`

## How to prompt your AI
Example: *"Read SPEC.md and 00_TEAM_CONTEXT.md. Create `lib/auth/AuthContext.tsx` exposing `useAuth()` exactly as in §9 (token in localStorage key `fre_token`, `/auth/me` on mount). Only create this file."* Then: *"Using shared `DataTable`, `StatusChip`, `FundingBar` and `unwrap`, build `/broker/properties` as in Task 4."* Review each diff, test the unhappy path, commit (`feat(broker): listing wizard step 3 financials`).
