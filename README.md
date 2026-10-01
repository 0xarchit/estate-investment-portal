# Fractional Real Estate Investment Portal

Academic fractional-property investment portal using Next.js App Router, TypeScript, MongoDB/Mongoose, Zod, JWT authentication, and a ledger-backed demo wallet. All amounts are integer paise.

## Implementation status

P2's application code is implemented. **The application cannot currently build or run these APIs until P1's shared foundation is merged.** This checkout has placeholders for the P1 models, handler, auth, and ledger/settings/notification/property services. See [P1 integration requirements](docs/P1_INTEGRATION.md) for exact exports.

- [x] Integer payout calculator, preview, transactional sale, investor payouts, and platform fee credit.
- [x] Demo top-up orders and verification, replay protection, wallet reads, and withdrawal approvals.
- [x] Portfolio holdings, estimates, summary, and transaction history.
- [x] Admin statistics, users, settings, KYC, and withdrawals.
- [x] Broker listing statistics, ownership-checked funding timeline, and notifications.
- [x] Demo seed script with eight listings, nine accounts, ledger reconciliation, and sample sale.
- [x] Unit and integration test source; isolated P1 contract support for development.
- [ ] Integration with actual P1 implementation and full application build.
- [ ] Full API/database acceptance testing with the actual P1 foundation.
- [ ] Frontend implementation and deployment by their respective owners.

## Team ownership

| Role | Scope | Contributor |
|---|---|---|
| P1 | Models, auth, handler, ledger, property lifecycle, investment engine | Team to fill |
| P2 | Payouts, demo wallet, portfolio, admin/broker data, seed, docs | Aryan Gupta |
| P3 | Shared frontend kit, public marketplace, investor UI | Team to fill |
| P4 | Admin UI | Team to fill |
| P5 | Auth and broker UI | Team to fill |

Live application: pending deployment. Demo video: pending recording.

## Architecture

Each API route declares its permitted roles and request schema through P1's shared `route()` wrapper. P2 services read the shared Mongoose models and pass the same Mongo session to every ledger and notification operation belonging to a financial transaction. The ledger is the only component that changes wallet balances.

```mermaid
flowchart LR
  UI[Investor / Broker / Admin UI] --> API[Next.js API routes]
  API --> Guard[P1 authentication + validation]
  Guard --> P2[P2 wallet / payout / portfolio / stats]
  P2 --> Ledger[P1 ledger]
  P2 --> DB[(MongoDB replica set)]
  Ledger --> DB
  P2 --> Demo[Local demo payment adapter: true]
```

## Local setup

Requires Node.js 20+ and MongoDB Atlas or a local replica set. Standalone MongoDB does not support the required multi-document transactions. Merge the P1 dependencies described above first.

```powershell
npm ci
Copy-Item .env.example .env
# Set MONGODB_URI, JWT_SECRET, and MOCK_GATEWAY_SECRET in .env.
# Use a dedicated demo database: the seed command clears its application collections.
npm run seed -- --reset-demo
npm run dev
```

The seed resets only the application's nine model collections, initializes indexes, funds wallets through the ledger, inserts investments, pays broker commissions for fully funded properties, and executes a sample sale. Re-running it recreates the same demo dataset. The explicit `--reset-demo` flag prevents an accidental reset.

## Demo payments

`demoRazorpayRequest()` always resolves to `true`. It performs no external requests and ignores any real provider credentials. A top-up is credited only after a valid, owned demo order and its generated HMAC are verified. The PAID marker and wallet credit commit together; replay returns `409 DUPLICATE_PAYMENT`.

1. Call `POST /api/v1/wallet/topup/order` with `{ "amount": 10000 }` (₹100).
2. Copy `orderId`, `mockPayment.paymentId`, and `mockPayment.signature` from its response.
3. Send those fields to `POST /api/v1/wallet/topup/verify`.
4. The response contains `{ "balance": 10000, "mock": true, "paymentSuccess": true }` for an initially empty wallet, inside the standard success envelope.

Withdrawals also simulate bank settlement. Approval debits the demo wallet, while rejection does not move money.

## Seed credentials

| Email | Password | Role / state |
|---|---|---|
| admin@demo.com | Admin@123 | Admin |
| rohit@demo.com | Broker@123 | Approved broker |
| newbroker@demo.com | Broker@123 | Unapproved broker |
| aman@demo.com | Investor@123 | Investor, approved KYC |
| priya@demo.com | Investor@123 | Investor, approved KYC |
| karan@demo.com | Investor@123 | Investor, approved KYC |
| neha@demo.com | Investor@123 | Investor, pending KYC review |
| vikram@demo.com | Investor@123 | Investor, approved KYC |
| fresh@demo.com | Investor@123 | Empty wallet, no KYC submitted |

## Documentation and checks

- [API reference](docs/API.md)
- [P1 integration requirements](docs/P1_INTEGRATION.md)
- [P2 file inventory and implementation status](docs/P2_IMPLEMENTATION.md)
- [Testing instructions and limitations](docs/testing/README.md)

Normal project checks after P1 lands: `npm test` and `npm run build`. Until then, isolated P2 checks can use the clearly marked contract double under `docs/testing`; those results do not establish correctness of P1's actual implementation.

Portfolio appreciation is an illustrative compound estimate capped at the property's holding period. Refunded holdings are excluded from both invested principal and current value in summary ROI. Sold holdings use actual recorded payout amounts. Daily statistics use UTC calendar days. Pending withdrawal requests do not reserve funds; approval rechecks available balance.

This is an academic project. No real money or securities are involved.
