# 02 — BACKEND 2 (P2): MONEY, ADMIN & SEED — payouts, wallet, portfolio, admin APIs, seed data

> Paste into your AI session **after** `00_TEAM_CONTEXT.md` and `SPEC.md`.
> You are **P2**. Follow the contracts in `00_TEAM_CONTEXT.md` exactly. You depend on P1's models/helpers (ready ~T+15–25) — start with the pure payout calculator so you are never blocked.

## Your role
Own everything that moves money after the invest step, plus the data the dashboards read, plus the **seed script** everyone tests with. Rubric weight you carry: Payout & ledger (15), Dashboards data (10), Deployment & docs (5).

## Files you OWN (touch nothing else)
`lib/server/services/{payout,wallet,portfolio,stats}.service.ts`, `lib/validators/{wallet,admin,kyc}.ts`, `app/api/v1/properties/[id]/sell/**`, `app/api/v1/properties/[id]/payout-preview/**`, `app/api/v1/investments/me/**`, `app/api/v1/portfolio/**`, `app/api/v1/wallet/**`, `app/api/v1/transactions/**`, `app/api/v1/kyc/**`, `app/api/v1/admin/**`, `app/api/v1/broker/**`, `app/api/v1/notifications/**`, `scripts/seed.ts`, `docs/**`, `README.md`, `lib/server/services/__tests__/payout.test.ts`.

## Files you must NOT touch
Models, `route()` handler, auth, ledger/settings/notification services, property + investment services (all P1). Use their exported functions. If a model needs a field → ask P1.

## Use from P1 (contracts in §8)
`route({auth, roles, schema}, fn)`, `ok()`, `ApiError`, `ledger.post(...)`, `getSettings()`, `notify()`, `assertTransition()`, `serializeProperty()`, models.

---

## TASKS (in order; commit after each)

### Payment demo override
Whenever this assignment refers to a Razorpay request, use a local demo adapter that automatically returns `true` (payment success). Do not send requests to Razorpay or use real payment credentials, even when keys are configured. Keep the existing order/verify API shapes, label responses `mock:true`, and return `paymentSuccess:true` after successful demo verification. Continue to validate the stored order, its owner, and the demo HMAC, and credit the wallet through `ledger.post` in the same Mongo transaction that marks the order PAID. Repeated verification must not credit the wallet twice.

### Task 1 — Pure payout calculator (T+0 → T+25, no dependencies)
`payout.service.ts → computePayout({ salePrice, platformFeePct, totalUnits, holders })` — **pure, no DB, BigInt integer math**:
```
bps         = Math.round(platformFeePct * 100)
platformFee = floor(salePrice * bps / 10000)
distributable = salePrice - platformFee
for each holder: amount = floor(distributable * units / totalUnits)
remainder = distributable - sum(amounts)  → add to the LARGEST holder (tie → lowest investorId)
assert sum(amounts) === distributable   // throw if not
return { platformFee, distributable, items:[{investorId,units,amount}], remainder }
```
Vitest with the PS example: sale ₹1,40,00,000 (`1_400_000_000` paise), fee 2% = ₹2,80,000, distributable ₹1,37,20,000; Aman 20/1000 → ₹2,74,400; Priya 50 → ₹6,86,000; Karan 400 → ₹54,88,000. Add a rounding case (e.g. 3 holders of 333/333/334 units, odd sale price) proving the sum is exact, and a loss case (sale < valuation).

### Task 2 — Preview + Execute payout + `/sell` (T+25 → T+55) ⭐ rubric-critical
- `previewPayout(propertyId, salePrice)`: load property (must exist), aggregate ACTIVE investments `$group` by `investorId` → `holders`; call `computePayout`; enrich with investor name, ownership %, invested (sum of `amount`), `roiPct = (amount - invested)/invested*100` (float ok for display only). Return shape in §7 (`payout-preview`). **No DB writes.**
- `GET /properties/:id/payout-preview?salePrice=` (ADMIN): validate `salePrice` positive integer paise; works for HOLDING properties (also allow preview for FUNDED).
- `executePayout(propertyId, salePrice, adminId)` in **one `session.withTransaction`**:
  1. Load property; `assertTransition(status,'SOLD')` — must be `HOLDING`, else `409 INVALID_TRANSITION`; if a `Payout` doc for the property already exists → **`409 ALREADY_SOLD`**. (Unique index on `payouts.propertyId` is the final guard; map its duplicate-key error to `ALREADY_SOLD`.)
  2. Recompute via `computePayout` (never trust a client preview).
  3. Insert `Payout` doc (`items`, `platformFee`, `distributable`, `executedBy`, `executedAt`).
  4. For each item: `ledger.post({ userId: investorId, type:'PAYOUT', direction:'CREDIT', amount, refType:'Payout', refId, session })`.
  5. Platform fee: `ledger.post({ userId: adminId, type:'FEE', direction:'CREDIT', amount: platformFee, refType:'Payout', refId, session })` (this is what "fees earned" KPIs sum).
  6. Mark that investor's investments `EXITED` and set `payoutAmount` (split proportionally across their investment docs by units; last doc takes rounding remainder).
  7. Property → `SOLD`, `salePrice`, `soldAt`. Notify every investor ("Payout credited: ₹…").
- `POST /properties/:id/sell` (ADMIN, body `{salePrice}`) → returns the payout doc. Calling it twice returns `409 ALREADY_SOLD` with **no double credit**.

### Task 3 — Wallet + ledger APIs (T+40 → T+70)
- `GET /wallet` → `{ balance }` from the user doc (kept in sync by the ledger).
- **Mock gateway (clearly labelled TEST MODE):** `POST /wallet/topup/order {amount}` — validate integer paise ≥ ₹100 and ≤ ₹10,00,000; create `orderId = 'order_' + uuid`; simulate the Razorpay request through the demo adapter above (always returns `true`) and return `{ orderId, amount, mock:true, mockPayment:{ paymentId:'pay_'+uuid, signature } }` where `signature = HMAC_SHA256(orderId + '|' + paymentId, MOCK_GATEWAY_SECRET)`. **Never keep orders in memory** (serverless instances don't share memory, so verify would randomly fail). Use the `GatewayOrder` model P1 provides (`{ orderId, userId, amount, status:'CREATED|PAID', paymentId }`). Verify must look the order up by `orderId` **and** `userId` and flip it to PAID atomically (`findOneAndUpdate({orderId, userId, status:'CREATED'}, {status:'PAID', paymentId})`; null → 409).
- `POST /wallet/topup/verify {orderId, paymentId, signature}`: **verify HMAC with timing-safe compare**; reject bad signature `400`; reuse of a `gatewayPaymentId` → `409 DUPLICATE_PAYMENT` (unique sparse index on transactions + pre-check); on success `ledger.post({type:'TOPUP', direction:'CREDIT', gatewayPaymentId, refType:'Gateway'})` and return `{ balance }`. Credit amount comes from the stored order, **never** from the client body.
- `POST /wallet/withdraw {amount, bankDetails}` (INVESTOR): amount ≤ balance, > 0 → `Withdrawal` PENDING (dummy bank details; validate shape). No ledger entry yet. `GET /wallet/withdrawals` own list.
- `GET /transactions` (auth): own ledger, **admin sees all**; filters `type`, `from`, `to`, `direction`, `page`, `limit`, `sort=-createdAt`. Include `balanceAfter`, `refType/refId`.

### Task 4 — Portfolio APIs (T+60 → T+85)
- `GET /investments/me` (INVESTOR): aggregate ACTIVE+EXITED+REFUNDED by property → one row per property: `units, ownershipPct = units/totalUnits*100, invested(sum amount), estimatedValue, payoutReceived, roiPct, status` + `property:{title,city,image,status,unitPrice,expectedAppreciationPct}`.
- Estimated value rules (document them in code comments): SOLD → `payoutAmount` total; CANCELLED/REFUNDED → `invested`; otherwise `invested * (1 + expectedAppreciationPct/100) ^ yearsElapsed` where `yearsElapsed` = (now − `fundedAt ?? first investment createdAt`) in years, capped at `holdingPeriodMonths/12`. Round to integer paise.
- `GET /portfolio/summary`: `totalInvested`, `currentValue` (sum estimated values of non-refunded holdings), `totalPayouts`, `roiPct = (currentValue − totalInvested)/totalInvested*100` (0 when nothing invested — **no NaN**), `walletBalance`, `allocation:[{propertyId,title,amount}]`, `recentTransactions` (last 5). Must return clean zeros for a brand-new investor (empty state).

### Task 5 — Admin APIs (T+70 → T+105)
All `roles:['ADMIN']`.
- `GET /admin/stats` per §7: `aum` = sum of ACTIVE investment amounts; `usersByRole`; `liveProperties`; `fundsRaisedThisMonth` (INVESTMENT debits this month); `platformFeesEarned` = sum of `FEE` credits; `charts.fundsRaisedOverTime` (group INVESTMENT transactions by day, last 30 days, fill gaps with 0); `propertiesByStatus`; `queues` counts (PENDING_APPROVAL properties, KYC PENDING, brokers with `brokerApproved:false`, PENDING withdrawals).
- `GET /admin/users` (`search` on name/email, `role`, `isActive`, pagination) / `PATCH /admin/users/:id` `{isActive?, role?, brokerApproved?}`: admin cannot deactivate or demote **themselves**; changing role away from ADMIN of the last admin blocked; notify user on broker approval.
- KYC: `POST /kyc` (INVESTOR) `{docs:[{url,name}]}` (1–3 docs, URLs from `/uploads`) → `kyc.status='PENDING'`, clear reason. `GET /admin/kyc?status=PENDING` → `{ userId, name, email, kyc }` list. `PATCH /admin/kyc/:userId {action, reason?}` → APPROVED / REJECTED (reason required on reject); notify user.
- Withdrawals: `GET /admin/withdrawals?status=` and `PATCH /admin/withdrawals/:id {action, reason?}`. **APPROVE** → in a transaction `ledger.post({type:'WITHDRAWAL', direction:'DEBIT'})` (fails `INSUFFICIENT_BALANCE` if balance dropped) and mark APPROVED + `processedBy`; REJECT stores reason. Only PENDING can be processed (else 409).
- `GET/PATCH /admin/settings` using `getSettings()`; validate `platformFeePct 0–20`, `brokerCommissionPct 0–10`, `maxOwnershipPct 1–100`. (P1's `invest()` reads these.)

### Task 6 — Broker + notifications APIs (T+90 → T+110)
- `GET /broker/properties` (BROKER): own listings with `fundingPct, investorCount, unitsSold, status, rejectionReason, commissionEarned` (sum of that property's COMMISSION credits). Support `status`, pagination.
- `GET /broker/stats`: `listed, live, funded, totalRaised (sum unitsSold*unitPrice across their properties), commissionEarned, pendingApprovals, fundingByProperty:[{title,fundingPct}]`.
- `GET /broker/properties/:id/funding-timeline`: **owner check** (other broker → 403/404) → cumulative `[{date, unitsSold}]` from investments.
- `GET /notifications` → `{ items (latest 50), unreadCount }`; `PATCH /notifications/:id/read` (own only); `PATCH /notifications/read-all`.

### Task 7 — SEED SCRIPT (start T+25, **must run by T+45**) ⭐
`npm run seed` (`scripts/seed.ts`, run with `tsx`): idempotent (wipe collections, re-insert). **Ledger consistency:** every money movement goes through `ledger.post` (never write `walletBalance` directly), so wallet == sum(ledger). **Do NOT depend on P1's `invest()` or property routes** — they land after T+55 but the seed must run by T+45. Instead insert Properties and Investments directly through the models (set `unitsSold` to match the investments), post the matching `INVESTMENT` DEBIT rows with `ledger.post`, post the broker `COMMISSION` credit for the FUNDED/HOLDING/SOLD properties, and for the SOLD one insert it as HOLDING then call **your own** `executePayout`. Only dependencies: models + `ledger.post` (P1, T+15).
- Accounts exactly as §10 of the context (admin, `rohit` approved broker, `newbroker` unapproved, aman/priya/karan/neha/vikram investors with KYC APPROVED + topped up, `fresh` investor with NOT_SUBMITTED & ₹0).
- Properties (all brokered by Rohit, images `https://picsum.photos/seed/<slug>-<n>/1200/800` ≥ 3–8 each, documents use a public dummy PDF URL, `geo` set for Noida/Bengaluru/Gurugram/Pune/Hyderabad/Mumbai): LIVE "2BHK, Sector 150, Noida" ₹1 Cr/1000 units/min 1/**470 sold across ≥3 investors**; LIVE "Retail Shop, Koramangala" with **exactly 10 units remaining**; FUNDED (commission already credited); HOLDING; SOLD (real payout via `executePayout`, so ROI shows); PENDING_APPROVAL; REJECTED with a believable `rejectionReason`; DRAFT. ≥ 8 properties, ≥ 5 investors, all money integer paise, valuation divisible by units.
- Also some notifications, one pending KYC (e.g. neha uploaded, awaiting approval), one pending withdrawal.
- Print a summary table (accounts + passwords + property statuses) at the end.

### Task 8 — Docs & README (T+120 → T+145)
- `docs/API.md`: table of every endpoint (method, path, role, body, response). If time: generate `docs/postman_collection.json` from it.
- `README.md` using the PS template: team table, live links (placeholders), tech stack, feature checklist `[x]/[ ]` (be honest), architecture paragraph + diagram (ASCII/mermaid), local setup (`npm install`, `cp .env.example .env`, `npm run seed`, `npm run dev`), **test credentials for all 3 roles**, API docs link, known limitations, footer disclaimer line.

## Acceptance checklist
- [ ] Unit test: ₹1.4 Cr sale → Aman ₹2,74,400, Priya ₹6,86,000, Karan ₹54,88,000, sum == ₹1,37,20,000 exactly
- [ ] Second `/sell` → `409 ALREADY_SOLD`, no extra ledger rows
- [ ] Top-up replay (same paymentId) → `409 DUPLICATE_PAYMENT`; bad signature rejected
- [ ] Wallet balance == sum of ledger credits − debits for every seeded user
- [ ] New investor (`fresh`) gets zeros (not NaN/null) from `/portfolio/summary` and `/investments/me`
- [ ] Investor/broker token on `/admin/**` and `/sell` → 403; broker B on broker A's timeline → 403/404
- [ ] Seed runs from empty DB in one command

## How to prompt your AI
Example: *"Read SPEC.md and 00_TEAM_CONTEXT.md. Write `payout.service.ts` with a pure `computePayout()` using BigInt integer math exactly as described in Task 1, plus a Vitest using the ₹1 Cr example. No DB access in the pure function."* Then: *"Now write `executePayout()` inside one mongoose transaction as in Task 2."*
