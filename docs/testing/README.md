# P2 verification

The P1 foundation is integrated. Checks below exercise the current application modules; the older contract fixture is retained only as historical handoff support.

## Fast regression suite

From the repository root:

```powershell
npm test
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
```

Verified on 2026-10-01: TypeScript and the production build passed. The suite currently has 83 passing unit/route tests. The 16 database tests skip when `P2_TEST_MONGODB_URI` is absent. A skip is not database validation: run the dedicated configuration below separately.

Coverage includes integer payout conservation and rounding, demo HMAC verification, stored order limits, wallet overflow, read-only preview, broker serialization and string ledger references, per-purchase appreciation, empty-body validation, property transaction filtering, role selection, and safe login redirects. Service unit tests isolate database calls; they do not establish transactional correctness by themselves.

## Real database acceptance

Use a disposable local MongoDB replica set. The suite deletes application collections before each test and resets demo data in its final test. It rejects hosts other than `localhost`/`127.0.0.1` and database names not starting with `p2_`.

```powershell
$env:P2_TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/p2_regression?replicaSet=rs0'
node node_modules/vitest/vitest.mjs run --config docs/testing/real.config.ts
Remove-Item Env:P2_TEST_MONGODB_URI
```

`real.config.ts` resolves `@/` to the repository and loads test URI/secrets before importing application configuration. No P1 contract aliases are used. Never point it at a shared or valuable database.

Verified on 2026-10-01: all 16 tests passed using MongoDB 7.0.14 in a disposable local replica set with the actual P1 models, ledger, route wrapper, and services.

| Area | Acceptance checks |
|---|---|
| Payout | Read-only preview; concurrent sales credit once; failed credits roll back; split purchases and tiny payouts conserve paise |
| Wallet | Owner/signature checks; replay and concurrency; failed credit restores CREATED state for retry |
| Withdrawals | Approval once; balance recheck; failed approval stays pending; rejection never debits |
| Access | Investor/broker denied admin routes; inactive accounts denied; broker ownership enforced |
| Administration | Self-demotion denied; concurrent cross-demotions retain an active admin; atomic KYC review and notification |
| Reporting | Fresh portfolio zeros; 30-day chart; broker listings serialize correctly and include commission |
| Seed | Eight properties, nine accounts, ten retail units remaining, one payout, all wallets reconcile |

## Browser acceptance checklist

Start the app against a dedicated seeded demo database, then use the credentials in the root README.

1. Select Investor, Broker, and Admin in turn. Matching demo credentials must open the corresponding workspace.
2. Choose Admin with investor credentials: show an inline role mismatch without granting an admin session.
3. Submit an empty form: errors link to email/password fields; keyboard focus reaches role choices, inputs, password visibility, and submit.
4. Open `/login?next=/investor/wallet` as an investor: retain the internal destination. External URLs and another role's workspace fall back to the authenticated role home.
5. Check narrow and short viewports: login content, mobile navigation, sidebar, and notifications remain reachable by scrolling.
6. With reduced motion enabled, smooth scrolling and entrance animations are disabled by the reduced-motion rules.

## Seed reset

```powershell
npm run seed -- --reset-demo
```

Use a dedicated demo database configured through `.env`. The seed requires the explicit reset flag, initializes model indexes, and checks replica-set support before deleting collections. It prints demo credentials and asserts that every wallet equals ledger credits minus debits. All payments and bank details are simulated.

## Legacy isolated configuration

`vitest.config.ts`, `tsconfig.json`, and `p1-contract-double.ts` in this directory describe the pre-integration fixture. They are not the acceptance configuration for the integrated application. Application routes never import this fixture.

## UI verification result and limits

On 2026-10-01 the scoped UI pass verified all three demo role logins, wrong-role rejection, keyboard radio selection, cross-role redirect fallback, mobile navigation Escape/focus return, and the corrected skip-link target. Login was visually inspected at 1440px, 768px, and 375px. Reduced-motion behavior was checked in CSS; OS-level motion emulation was unavailable.

Existing items outside this pass: large investor dashboard currency values wrap mid-number on narrow screens; broker logout is reachable through shared Notifications navigation but lacks a direct broker-layout control. These owner-specific screens were left unchanged. The repository has no ESLint configuration, so a standalone lint run is not a completed check.
