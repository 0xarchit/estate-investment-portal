# P1 integration requirements for P2

P2 is implemented against section 8 of `Agents/00_TEAM_CONTEXT.md`. At initial implementation time the following P1 files were absent. They are now integrated; the real database suite passed all 16 acceptance checks. P2 fixes adapt to the actual contracts below. The user-authorized sign-in extension also adds optional role validation to the existing auth route and shared auth schema.

## Required exports

| Module | Named exports / contract |
|---|---|
| `lib/server/models/index.ts` | `User`, `Property`, `Investment`, `Transaction`, `Payout`, `Withdrawal`, `Notification`, `Settings`, `GatewayOrder` as typed Mongoose models |
| `lib/server/errors.ts` or `errors/index.ts` | `ApiError(status, code, message, details?)` |
| `lib/server/http.ts` or `http/index.ts` | `ok(data, message?, status?)`, `paginate({page,limit})`, `listResult(items,total,page,limit)` |
| `lib/server/handler.ts` or `handler/index.ts` | `route({auth,roles,schema?}, fn)`; `fn` receives `{req,user,params,query,body}` |
| `lib/server/services/ledger.service.ts` | `ledger.post({...})`, `ledger.getBalance(userId, session?)` |
| `lib/server/services/settings.service.ts` | `getSettings(session?)` |
| `lib/server/services/notification.service.ts` | `notify(userId,{type,title,body,link?},session?)` |
| `lib/server/services/property.service.ts` | `assertTransition(from,to)`, `serializeProperty(doc,extras?)` |

If P1 chooses individual model files, expose a named barrel or adapt the imports in P2's owned files when integrating.

## Required behavior

- `route` connects to the database; reads bearer tokens; loads the current user's role/activity from the database; rejects inactive users with 401; enforces allowed roles with 403; validates the supplied Zod schema; and maps errors to the standard JSON envelope. `query` is a plain string-keyed object and `params` is resolved before the callback.
- `ledger.post` accepts a Mongoose `ClientSession`. Every query and insert must use that session, and failures must throw so the outer transaction aborts. Return the transaction document with `balanceAfter`. Do not open a nested transaction when a session is supplied.
- Ledger input `userId` is a string; persisted `Transaction.refId` is a string. Property ObjectIds supplied to writes are cast by the model; P2 lookup filters use strings. Optional sparse unique fields must be absent when unused rather than `null` or an empty string.
- `notify` must attach supplied sessions to writes and propagate failures. P2 puts financial notifications inside the financial transaction.
- `getSettings` supplies numeric defaults and reads within the supplied session. Seed creates the singleton settings document. Payout preview reads Settings directly and falls back to configured defaults without calling the create-on-read helper. The settings document must retain Mongoose's `__v`: P2 uses an atomic increment to serialize concurrent admin role/deactivation changes.
- `assertTransition('HOLDING','SOLD')` succeeds; other sale transitions throw `409 INVALID_TRANSITION`.
- `serializeProperty` is asynchronous and must be awaited, including within list mapping. It merges extras including `investorCount` and `commissionEarned`, and returns computed funding percentage/remaining units without sensitive fields.
- Shared model fields, timestamps, and enum values match section 5. Fully funded and holding properties have valid positive `totalUnits` and `unitPrice`; every owned unit is represented by an ACTIVE investment before sale.
- Unique indexes must exist on `Payout.propertyId`, `GatewayOrder.orderId`, and sparse `Transaction.gatewayPaymentId`. The seed initializes all model indexes before use. Production deployment must build the same indexes.
- Wallets default to zero; seed and P2 services never assign balances directly. Model validation must permit P2's transaction-scoped status/payout updates.

## Integration sequence

1. Merge P1's actual implementation and resolve any export/type differences in P2-owned files.
2. Configure a dedicated MongoDB replica set/Atlas database and the shared environment.
3. Run the seed once with `npm run seed -- --reset-demo`.
4. Run the standard TypeScript/build checks and P2 tests against the actual foundation.
5. Exercise repeated and concurrent sells/top-ups/withdrawal approvals, forced transaction rollback, role enforcement, broker ownership, and ledger reconciliation.

The fixture in `docs/testing/p1-contract-double.ts` is exclusively an isolated test dependency. Application code never imports it. Passing those tests is not equivalent to completing this integration sequence.
