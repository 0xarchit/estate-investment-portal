# 01 — BACKEND 1 (P1): CORE — scaffold, models, auth, ledger, property lifecycle, invest engine

> Paste into your AI session **after** `00_TEAM_CONTEXT.md` and `SPEC.md`.
> You are **P1**. You unblock everyone else, so push early and often. Follow the contracts in `00_TEAM_CONTEXT.md` exactly (field names, error codes, response shapes).

## Your role
Build the backend foundation and the two highest-scoring engines: **property lifecycle** and **investment (atomic, transactional)**. Rubric weight you carry: Auth & RBAC (15), Property lifecycle (15), Investment engine (15), Code quality (8).

## Files you OWN (touch nothing else)
`package.json`, `.env.example`, `next.config.*`, `lib/server/{config,db,errors,handler,http,rateLimit,auth}/**`, `lib/server/models/**`, `lib/server/services/{ledger,settings,notification,property,investment}.service.ts`, `lib/validators/{auth,property,investment}.ts`, `app/api/v1/auth/**`, `app/api/v1/uploads/**`, `app/api/v1/properties/route.ts`, `app/api/v1/properties/[id]/{route,submit,approve,reject,status,investors}/**`, `app/api/v1/investments/route.ts`, `scripts/concurrency-test.ts`, `PROMPTS.md`, `prompts-log/`.

## Files you must NOT touch
Anything under `components/`, `app/` pages, `lib/api/`, `lib/format.ts`, payout/wallet/portfolio/stats services, `scripts/seed.ts` (P2). Need a model change that P2 requests? Do it, push, tell them.

---

## TASKS (do in this order; commit after each)

### Task 1 — Scaffold + deps (T+0 → T+8, PUSH IMMEDIATELY)
- `npx create-next-app@latest` (TypeScript, Tailwind, App Router, no src dir, ESLint). Push to `main`. Add the other 4 as collaborators.
- Install **all** deps for the whole team in one go so nobody touches `package.json` later:
  `mongoose zod bcryptjs jsonwebtoken cloudinary uuid @tanstack/react-query axios react-hook-form @hookform/resolvers recharts react-hot-toast lucide-react framer-motion swiper clsx tailwind-merge class-variance-authority date-fns` + dev: `@types/bcryptjs @types/jsonwebtoken tsx vitest`.
- `.env.example` with a one-line comment per variable: `MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN=1d, CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, MOCK_GATEWAY_SECRET, PLATFORM_FEE_PCT=2, BROKER_COMMISSION_PCT=1, MAX_OWNERSHIP_PCT=49, NEXT_PUBLIC_APP_URL`.
- `lib/server/config/env.ts` (validate env with zod, fail fast). `next.config`: `images.remotePatterns` for `picsum.photos`, `res.cloudinary.com`, `images.unsplash.com`; security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP-lite) as the helmet equivalent.
- Add `package.json` scripts: `seed` (`tsx scripts/seed.ts`), `concurrency` (`tsx scripts/concurrency-test.ts`), `test` (`vitest`).

### Task 2 — DB + models (T+8 → T+15, PUSH)
- `lib/server/db.ts`: cached Mongoose connection (global cache for hot reload).
- Models exactly per **§5 of 00_TEAM_CONTEXT** (User, Property, Investment, Transaction, Payout, Withdrawal, Notification, Settings). `timestamps: true`. Indexes: `users.email` unique; `properties` on `status, city, brokerId`; `investments` compound `{investorId, propertyId}`, `idempotencyKey` unique sparse; `transactions` `{userId, createdAt}`, `gatewayPaymentId` unique sparse; `payouts.propertyId` unique.
- Property schema validation: `valuation % totalUnits === 0`, `minUnits ≤ totalUnits`, money fields are integers (`Number.isInteger`).

### Task 3 — Helpers (T+10 → T+20, PUSH)
- `errors.ts`: `ApiError(status, code, message, details?)`.
- `http.ts`: `ok(data, message?, status=200)`; `parseQuery`, `paginate({page,limit})` returning `{skip,limit}` and `listResult(items,total,page,limit)` → `{items,page,limit,total,totalPages}`.
- `handler.ts`: `route(options, fn)` as defined in §8 of the context. Must: connect DB, optional Zod body validation, verify JWT → load user (`select +role`) → **401 if not found or `isActive === false`**, 403 on wrong role, central error mapping (ZodError → `VALIDATION_ERROR` 400 with `details`, Mongo duplicate key → 409, unknown → 500 with generic message, **never leak stack traces**), rate limiting hook.
- `rateLimit.ts`: simple in-memory fixed-window limiter (keyed by IP+route). Apply to `/auth/*` (10/min) and `POST /investments` (20/min). 429 `TOO_MANY_REQUESTS`.
- Sanitise bodies: strip keys starting with `$` or containing `.` (NoSQL injection) before validation.
- `ledger.service.ts`, `settings.service.ts`, `notification.service.ts` per §8. **`ledger.post` is the ONLY place that changes `walletBalance`.** DEBIT must use a conditional `findOneAndUpdate({_id, walletBalance:{$gte:amount}}, {$inc:{walletBalance:-amount}}, {new:true, session})`; null → `ApiError(400,'INSUFFICIENT_BALANCE')`. Always writes `balanceAfter`. Amount must be a positive integer.

### Task 4 — Auth (T+15 → T+25, PUSH)
- Zod schemas in `lib/validators/auth.ts` (shared with frontend): name ≥2, valid email, phone 10 digits (`/^[6-9]\d{9}$/`), password ≥8 with a number and a symbol, role `INVESTOR | BROKER` only (**ADMIN can never be registered**).
- `POST /auth/register` (bcryptjs cost 10–12; lowercase email; 409 on duplicate email; brokers start `brokerApproved:false`), `POST /auth/login` (generic "Invalid email or password"; **reject deactivated users**), `POST /auth/logout` (stateless OK → `{}`), `GET /auth/me`, `POST /auth/change-password`.
- JWT `{sub, role}` via `jsonwebtoken`, expiry from env.
- Export `assertBrokerOwns(property, user)` (admin passes; broker must match `brokerId` else 403/404).
- Stretch only after everything else: forgot/reset password.

### Task 5 — Uploads (T+25 → T+35)
`POST /uploads` multipart `file`: whitelist MIME `image/jpeg|png|webp|application/pdf`, max 5 MB, upload to Cloudinary, return `{url, publicId, name}` only. If Cloudinary env vars are missing, return a clearly-labelled fallback `https://picsum.photos/seed/<random>/1200/800` for images (so dev isn't blocked).

### Task 6 — Property lifecycle (T+30 → T+65)
`property.service.ts` + routes (see §7 table of context). Details:
- **Transition table** + `assertTransition(from,to)` (§6). Export it; P2 uses it for `/sell`.
- `POST /properties`: BROKER must be `brokerApproved` else `403 BROKER_NOT_APPROVED`; ADMIN allowed. Creates `DRAFT`. Validation: `valuation` integer paise, `valuation % totalUnits === 0` and `unitPrice = valuation/totalUnits` must be a **whole rupee** (`unitPrice % 100 === 0`), `minUnits ≤ totalUnits`; `maxUnitsPerInvestor` defaults to `floor(totalUnits * maxOwnershipPct/100)` from `getSettings()`. Drafts may be saved with partial fields (relax required fields at DRAFT; enforce at submit).
- `PATCH /properties/:id`: DRAFT/REJECTED → owner broker or admin may edit everything. PENDING_APPROVAL → admin only. LIVE+ → only `description`, `images`, `documents`; any attempt to change `valuation/totalUnits/unitPrice` once status ≥ LIVE **or any investment exists** → `403 LOCKED_FIELDS` with a clear message.
- `POST /:id/submit`: owner broker/admin; from DRAFT/REJECTED; require all required fields + **≥ 3 images** else 400 listing the missing fields; clears `rejectionReason`; notify admins.
- `POST /:id/approve` (admin): `PENDING_APPROVAL → LIVE`, set `liveAt`, `approvedBy`, notify broker. `POST /:id/reject`: `reason` required (zod min 5 chars) → `REJECTED`, store `rejectionReason`, notify broker.
- `GET /properties`: filters `city, type, minPrice, maxPrice` (on `unitPrice`), `status`, `search` (title/city regex, escaped), `minFunding/maxFunding`, `sort` (`-createdAt`, `unitPrice`, `-fundingPct`…), pagination. **Public/unauthenticated and investors see only LIVE and FUNDED** (plus HOLDING/SOLD if explicitly requested via `status`); admin sees all; use `optionalAuth`. Return serialized items.
- `GET /properties/:id`: LIVE/FUNDED/HOLDING/SOLD public; DRAFT/PENDING/REJECTED/CANCELLED only owner broker or admin (else 404). `investorCount` = distinct `investorId` of ACTIVE investments.
- `GET /:id/investors`: owner broker/admin only (broker of another property → 403/404). Group by investor; broker response masks name to initials.
- `POST /:id/status` (admin) body `{status}`: `FUNDED→HOLDING` (notify investors) and `LIVE→CANCELLED`. **Cancel = one Mongo transaction:** for every ACTIVE investment → `ledger.post({type:'REFUND', direction:'CREDIT', refType:'Investment', refId})`, mark investment `REFUNDED`, set property `CANCELLED` + `cancelledAt`, notify investors. Idempotent (second call → 409 INVALID_TRANSITION).

### Task 7 — INVESTMENT ENGINE (T+55 → T+90) ⭐ highest value
`investment.service.ts → invest({ userId, propertyId, units, idempotencyKey })` and `POST /investments` (role INVESTOR, rate-limited, zod `{propertyId, units:int>0, idempotencyKey?}`). **Never trust client amount**; compute `amount = units * unitPrice` on the server.

Inside `session.withTransaction(async () => { ... })`:
1. Load user in session → `isActive`, `kyc.status === 'APPROVED'` else `403 KYC_NOT_APPROVED`.
2. Load property in session → `status === 'LIVE'` else `409 PROPERTY_NOT_LIVE`.
3. `units >= property.minUnits` else `400 BELOW_MIN_UNITS`.
4. Per-investor cap: `existingUnits` (sum of ACTIVE investments for this user+property in session) + `units ≤ maxUnitsPerInvestor` else `409 MAX_OWNERSHIP_EXCEEDED` (message states the limit).
5. **Atomic anti-overselling:** `Property.findOneAndUpdate({ _id, status:'LIVE', unitsSold: { $lte: totalUnits - units } }, { $inc: { unitsSold: units } }, { new: true, session })`. `null` → re-read remaining and throw `ApiError(409,'INSUFFICIENT_UNITS', 'Only N units remain')`.
6. `ledger.post({ userId, type:'INVESTMENT', direction:'DEBIT', amount, refType:'Property', refId: propertyId, session })` → throws `INSUFFICIENT_BALANCE` (transaction aborts, so the `$inc` from step 5 rolls back).
7. Create `Investment { investorId, propertyId, units, amount, status:'ACTIVE', idempotencyKey }` (duplicate key on `idempotencyKey` → return the original result or `409 DUPLICATE_REQUEST`).
8. If `updated.unitsSold === updated.totalUnits`: in the **same transaction** set `status:'FUNDED'`, `fundedAt`, and credit broker commission: `commission = floor(valuation * brokerCommissionPct / 100)` (use integer/BigInt math; pct from `getSettings`) via `ledger.post({ userId: brokerId, type:'COMMISSION', direction:'CREDIT', refType:'Property', refId })`. Notify broker + all investors ("funding complete").
9. Return exactly the PS sample shape: `{ investment:{_id,units,amount,ownershipPct,status}, property:{unitsSold,fundingPct,status}, walletBalance }`, message `You now own X% of <title>`.

Notes: handle Mongo `TransientTransactionError` (withTransaction retries). Run side-effect notifications **after** commit if easier. Add a Vitest for pure helpers (ownership %, commission math).

### Task 8 — Concurrency proof (T+90 → T+100)
`scripts/concurrency-test.ts`: seeded property with 10 units left, two investors, fire both `invest(10 units)` with `Promise.all`. Print: exactly one success, one `409 INSUFFICIENT_UNITS`, final `unitsSold === totalUnits`, status FUNDED, commission credited once. This is also what the team shows in the demo video.

### Task 9 — Hardening (T+100 → T+125)
- Hit your APIs with an **investor token** on admin routes → must be `403` (RBAC test list: approve, reject, status, sell is P2's but verify), broker B opening broker A's investors → `403/404`, deactivated user token → `401`.
- Consistent error shapes everywhere, no stack traces, no `passwordHash` in any response.
- Review that every handler uses `route({...})` with explicit `roles`.

### Task 10 — PROMPTS.md merge + helper duty (T+105 → T+148)
- Collect `prompts-log/p1.md … p5.md` from each teammate and merge into root `PROMPTS.md`: the 10–20 most important prompts in order, tagged by person, each with a one-line note on what it produced (part of the 7-mark viva/PROMPTS rubric).
- You finish early, so act as tester/helper: run the demo flow end-to-end, hit admin APIs with an investor token, and tell the owning frontend person about bugs. If a frontend owner is behind (most likely P3, who has the most pages), take over one named page only after an explicit ownership transfer in chat and the commit message.

## Acceptance checklist (tick before saying "done")
- [ ] Admin cannot be registered; deactivated user → 401 on every route
- [ ] Investor token on `/approve`, `/reject`, `/status` → 403
- [ ] Wallet changes ONLY through `ledger.post`; `balanceAfter` always set
- [ ] `invest()` is one transaction; overselling impossible; `409` message says how many units remain
- [ ] Reaching 100% sets FUNDED + `fundedAt` + broker COMMISSION ledger row, exactly once
- [ ] Valuation/units/unitPrice locked after LIVE or first investment (403 `LOCKED_FIELDS`)
- [ ] Cancel refunds every investor with `REFUND` rows, in one transaction

## How to prompt your AI (one feature per prompt)
Example: *"Read SPEC.md and 00_TEAM_CONTEXT.md. Write `lib/server/services/investment.service.ts` with `invest()` as specified in Task 7 using Mongoose `session.withTransaction`. Use `ApiError` with the listed codes. Do not touch other files."* Review the diff, run `npm run concurrency`, then commit with `feat(invest): atomic transactional invest()`.
