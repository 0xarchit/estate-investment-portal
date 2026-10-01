# Fractional Real Estate Investment Portal — Specification

## 1. Executive Summary & Objective
A modern, transparent fractional real estate investment portal that democratizes high-value real estate investing. Investors can purchase fractional units (tokens/shares) of residential and commercial properties, track portfolio valuation and appreciation, receive automated exit payouts, and manage funds via an integrated ledger-backed wallet.

## 2. Core Personas & Roles
1. **Admin (`ADMIN`)**:
   - Oversees portal activity, reviews and approves/rejects broker property listings.
   - Manages user status (activate/deactivate, approve brokers).
   - Approves investor KYC submissions and withdrawal requests.
   - Transitions property states (LIVE -> HOLDING, LIVE -> CANCELLED with full refunds).
   - Records property exit sales with live payout preview and executes atomic investor payouts.
   - Configures global platform settings (Platform fee %, Broker commission %, Max ownership cap %).

2. **Broker (`BROKER`)**:
   - Registers and awaits admin verification before listing properties.
   - Creates and manages property listings with multi-step wizard (Basics, Location, Financials, Media, Review).
   - Submits draft listings for approval (enforces >= 3 images and validated financials).
   - Tracks listing performance, funding timeline, and earned commissions (credited upon 100% funding).

3. **Investor (`INVESTOR`)**:
   - Explores marketplace of live properties with detailed financials, metrics, calculator, and documents.
   - Submits KYC verification (identity/financial documents).
   - Adds funds to wallet via mock gateway (or Razorpay test mode) with HMAC verification.
   - Invests in properties atomically with strict anti-overselling and per-investor ownership caps.
   - Tracks portfolio performance, appreciation, dividends, and exit payouts.
   - Requests withdrawals back to bank accounts.

## 3. Financial & Ledger Rules
- **Money Representation**: Integer paise everywhere (1 INR = 100 paise). Float values strictly disallowed in database and API payloads.
- **Double-Entry / Append-Only Ledger**: Wallet balances can ONLY change through `ledger.post()`. Every balance mutation creates an immutable `Transaction` record with `balanceAfter`.
- **Property Financials**:
  - `valuation` in paise.
  - `totalUnits` must divide valuation evenly (`valuation % totalUnits === 0`).
  - `unitPrice = valuation / totalUnits` must be a whole rupee (`unitPrice % 100 === 0`).
- **Atomic Investment Engine**:
  - Validates active KYC status.
  - Enforces per-investor ownership limit (default <= 49% of total units).
  - Atomic decrement of remaining units via Mongoose/MongoDB query condition: `unitsSold: { $lte: totalUnits - units }`.
  - Atomic wallet debit via ledger within transactional boundary.
  - When 100% funded, automatically transitions to `FUNDED` and credits broker commission.
- **Exit Payout Engine**:
  - Admin enters final sale price.
  - Platform fee deducted (`floor(salePrice * feePct / 100)`).
  - Distributable pool shared proportionally by unit holdings (`floor(distributable * units / totalUnits)`).
  - Rounding remainder assigned to the largest unit holder to ensure zero-loss conservation.
  - Credited directly to investor wallets; investments marked `EXITED`.

## 4. State Machines
### Property Status Machine:
- `DRAFT` -> `PENDING_APPROVAL` (submitted by broker with >= 3 images)
- `PENDING_APPROVAL` -> `LIVE` (approved by admin)
- `PENDING_APPROVAL` -> `REJECTED` (rejected with reason by admin)
- `REJECTED` -> `PENDING_APPROVAL` (re-submitted by broker)
- `LIVE` -> `FUNDED` (automatically when `unitsSold === totalUnits`)
- `LIVE` -> `CANCELLED` (admin cancellation; triggers 100% wallet refunds to all investors)
- `FUNDED` -> `HOLDING` (admin confirms acquisition/closing)
- `HOLDING` -> `SOLD` (admin records exit sale with payout execution)

### KYC Status Machine:
- `NOT_SUBMITTED` -> `PENDING` (investor uploads 1-3 docs) -> `APPROVED` | `REJECTED` (admin review)

### Withdrawal Status Machine:
- `PENDING` -> `APPROVED` (debits wallet via ledger) | `REJECTED` (with reason)

## 5. Team Division & File Isolation
- **P1 (Backend 1 - Core)**: Scaffold, models, DB, auth API, handler, ledger service, property lifecycle, investment engine.
- **P2 (Backend 2 - Money & Admin)**: Payout engine, wallet & mock gateway, portfolio API, admin/broker APIs, seed script.
- **P3 (Frontend 1 - Main UI & Investor)**: Design system, shared kit, layouts, public marketplace, property detail, investor portal.
- **P4 (Frontend 2 - Admin)**: Admin layout, dashboard, approvals, sale execution, KYC review, user management, settings.
- **P5 (Frontend 3 - Broker & Auth)**: Auth context, route guards, auth pages, broker layout, property creation wizard, broker analytics.
