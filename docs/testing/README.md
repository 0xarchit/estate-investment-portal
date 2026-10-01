# P2 checks

## Current status

The initial 14 unit checks passed using an isolated P1 contract double. Integration test source is provided but database integration has not yet been verified. The real P1 foundation is absent, so the full application build and live API acceptance checks remain pending.

## Isolated checks while P1 is absent

From the repository root:

```powershell
node node_modules/vitest/vitest.mjs run --config docs/testing/vitest.config.ts
node node_modules/typescript/bin/tsc --project docs/testing/tsconfig.json --noEmit
```

The isolated config aliases only the missing P1 dependencies to `p1-contract-double.ts`. The type-check config uses the same contract types. Neither configuration changes production module resolution. The default project build still needs real P1 files.

The unit suite covers the PS payout example, conservation of paise, deterministic rounding, losses, invalid holdings, safe-integer limits, demo signature validation, request validators, and portfolio estimates.

## Database checks

Create a disposable local MongoDB replica set and set `P2_TEST_MONGODB_URI` to its URI. Use a database dedicated to this suite: it clears application collections before every test. The suite rejects non-local hosts and skips automatically when no test URI is set.

```powershell
$env:P2_TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/p2-isolated-tests?replicaSet=rs0'
node node_modules/vitest/vitest.mjs run --config docs/testing/vitest.config.ts
```

Integration tests cover preview reads, sale/credit rollback, concurrent sales, purchase-level payout splitting, tiny payouts, top-up ownership/signature/replay/concurrency, withdrawal rechecks, empty portfolios, route role declarations, broker ownership, admin cross-demotions, KYC, and demo seed reconciliation.

These tests use real Mongo transactions with an explicit P1 test double. The double's JWT/ledger/handler behavior is test support, not a verification of the future P1 implementation. Repeat acceptance checks with the actual P1 modules after integration.

## Seed

After P1 is available and `.env` points to a dedicated demo database:

```powershell
npm run seed -- --reset-demo
```

The seed aborts without its reset flag and checks replica-set support before deleting data. It prints demo credentials and property statuses, then asserts that every wallet equals credits minus debits.
