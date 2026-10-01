# API reference

Base path: `/api/v1`. Money is integer paise; IDs are strings; timestamps are ISO dates. Protected routes use `Authorization: Bearer <jwt>`. P1's route wrapper authenticates users and rejects inactive accounts before invoking these handlers.

Success: `{ "success": true, "data": {}, "message": "optional" }`.

Failure: `{ "success": false, "error": { "code": "CODE", "message": "Readable explanation", "details": {} } }`.

Paged lists return `{items,page,limit,total,totalPages}`. Defaults: `page=1`, `limit=20`; maximum limit 100. Unknown body fields are rejected by P2 schemas. All routes below require the P1 foundation described in [P1_INTEGRATION.md](P1_INTEGRATION.md).

## Implemented P2 routes

| Method | Path | Role | Body / query | Response `data` |
|---|---|---|---|---|
| GET | `/properties/:id/payout-preview` | ADMIN | `salePrice` positive integer query | `{salePrice,platformFeePct,platformFee,distributable,items,remainder,sumCheck}` |
| POST | `/properties/:id/sell` | ADMIN | `{salePrice}` | `{payout}` |
| GET | `/wallet` | INVESTOR | — | `{balance}` |
| POST | `/wallet/topup/order` | INVESTOR | `{amount}` | `{orderId,amount,mock:true,mockPayment:{paymentId,signature}}` (201) |
| POST | `/wallet/topup/verify` | INVESTOR | `{orderId,paymentId,signature}` | `{balance,mock:true,paymentSuccess:true}` |
| POST | `/wallet/withdraw` | INVESTOR | `{amount,bankDetails:{accountName,accountNumber,ifsc}}` | PENDING Withdrawal (201) |
| GET | `/wallet/withdrawals` | INVESTOR | `status?,page?,limit?` | Paged own withdrawals |
| GET | `/transactions` | Any authenticated role | `propertyId?,type?,direction?,from?,to?,page?,limit?,sort=-createdAt` | Paged own ledger; ADMIN sees all |
| GET | `/investments/me` | INVESTOR | — | `{items:[Holding]}` |
| GET | `/portfolio/summary` | INVESTOR | — | `{totalInvested,currentValue,totalPayouts,roiPct,walletBalance,allocation,recentTransactions}` |
| POST | `/kyc` | INVESTOR | `{docs:[{url,name}]}` (1–3 HTTPS documents) | `{status,docs,reason?}` (201) |
| GET | `/admin/stats` | ADMIN | — | `{kpis,charts,queues}` |
| GET | `/admin/users` | ADMIN | `search?,role?,isActive=true\|false,page?,limit?` | Paged users, excluding password hashes |
| PATCH | `/admin/users/:id` | ADMIN | `{isActive?,role?,brokerApproved?}` | Updated user |
| GET | `/admin/kyc` | ADMIN | `status=PENDING,page?,limit?` | Paged `{userId,name,email,kyc}` |
| PATCH | `/admin/kyc/:userId` | ADMIN | `{action:'APPROVE'\|'REJECT',reason?}` | `{userId,name,email,kyc}` |
| GET | `/admin/withdrawals` | ADMIN | `status?,page?,limit?` | Paged withdrawals |
| PATCH | `/admin/withdrawals/:id` | ADMIN | `{action:'APPROVE'\|'REJECT',reason?}` | Updated Withdrawal |
| GET | `/admin/settings` | ADMIN | — | Settings |
| PATCH | `/admin/settings` | ADMIN | `{platformFeePct?,brokerCommissionPct?,maxOwnershipPct?}` | Updated Settings |
| GET | `/broker/properties` | BROKER | `status?,page?,limit?` | Paged own properties with `fundingPct,remainingUnits,investorCount,commissionEarned` |
| GET | `/broker/stats` | BROKER | — | `{listed,live,funded,totalRaised,commissionEarned,pendingApprovals,fundingByProperty}` |
| GET | `/broker/properties/:id/funding-timeline` | Owning BROKER | — | `[{date,unitsSold}]` cumulative |
| GET | `/notifications` | Any authenticated role | — | `{items,unreadCount}`; latest 50 own notifications |
| PATCH | `/notifications/:id/read` | Owner | — | Updated Notification |
| PATCH | `/notifications/read-all` | Any authenticated role | — | `{modifiedCount}` for own notifications |

## Payout details

Preview requires FUNDED or HOLDING; execution requires HOLDING. `items` in preview contain `{investorId,name,units,ownershipPct,invested,amount,roiPct}`. `sumCheck` is a boolean confirming investor amounts equal the distributable pool. `remainder` is the pre-allocation rounding residue, already included in the largest holder's final amount. Equal-size largest holders are ordered by investor ID.

Execution recomputes all amounts in a Mongo transaction, credits each investor and the admin platform fee, marks purchases EXITED with individually allocated `payoutAmount`, changes the property to SOLD, and inserts notifications. Zero-paise credits are skipped because ledger entries must be positive. A repeated/concurrent sale returns `409 ALREADY_SOLD`; incomplete active holdings return `409 INVALID_HOLDINGS`.

## Demo wallet flow

The local Razorpay demo adapter always returns `true`. Real provider keys are ignored and no payment-provider network request is made. `MOCK_GATEWAY_SECRET` signs locally generated demo confirmations. The existing academic demo has a fallback secret; configure an explicit value for a shared deployment.

1. Create an order with an amount between `10_000` and `100_000_000` paise (₹100–₹10,00,000).
2. Send the returned order ID and `mockPayment` fields to verification.
3. Verification checks the signature and order owner, then commits the PAID marker and ledger credit together. The credited amount is taken from the stored order.

Invalid signatures return `400 INVALID_SIGNATURE`; orders belonging to another user return `404 NOT_FOUND`; replay returns `409 DUPLICATE_PAYMENT`. Sending client-provided `amount` to verification is rejected.

Withdrawal account data is dummy demo data: 9–18 account-number digits and an IFSC-shaped string. A request checks the current balance but does not reserve money. Only approval debits the wallet, rechecking balance in the transaction. A failed debit keeps the request PENDING. Processed requests return `409 CONFLICT` on another approval/rejection. Reject reasons must be at least five characters.

## Portfolio and reporting

Holding fields: `{propertyId,property:{title,city,image,status,unitPrice,expectedAppreciationPct},units,ownershipPct,invested,estimatedValue,payoutReceived,roiPct,status}`. All purchase documents for the investor/property are grouped.

SOLD uses actual payouts; CANCELLED/REFUNDED returns invested principal. Other holdings sum per-purchase compound estimates from the later of `fundedAt` and that purchase's creation date, capped by `holdingPeriodMonths`. Estimates are rounded to integer paise. Refunded holdings are excluded from both summary principal and current value so refunds do not create artificial negative ROI. New accounts return zeros and empty arrays.

Admin `kpis`: `aum`, `totalUsers`, `usersByRole` (object keyed by role), `liveProperties`, `fundsRaisedThisMonth`, `platformFeesEarned`. `charts` contains `fundsRaisedOverTime` (30 UTC days, including zero days) and `propertiesByStatus`. `queues` counts `pendingProperties`, `pendingKyc`, `pendingBrokers`, and `pendingWithdrawals`.

Transaction `from`/`to` accept ISO timestamps with timezone; the interval is inclusive. `type` accepts TOPUP, INVESTMENT, PAYOUT, REFUND, COMMISSION, WITHDRAWAL, FEE. `propertyId` includes direct property transactions, payouts referencing the property's payout records, and refunds referencing its investments. Non-admin results always retain the authenticated user filter. Ledger results include `amount`, `direction`, `balanceAfter`, `refType`, `refId`, and timestamps.

Admin users cannot deactivate or demote themselves; concurrent admin changes retain at least one active admin. `brokerApproved` can only be set for a BROKER. KYC submission is permitted from NOT_SUBMITTED/REJECTED, and review only from PENDING. Settings accept fee 0–20%, commission 0–10%, ownership cap 1–100%, with at most two decimal places.

## P1 route contracts (not implemented by P2)

These entries document the shared team contract now present in the integrated checkout. P2 verification covers the financial integration paths; it is not an exhaustive acceptance test of every P1 endpoint.

| Method | Path | Access | Body / query | Response `data` |
|---|---|---|---|---|
| POST | `/auth/register` | Public | `{name,email,phone,password,role:'INVESTOR'\|'BROKER'}` | `{user}` (201) |
| POST | `/auth/login` | Public | `{email,password,role?}` | `{token,user}` |
| POST | `/auth/logout` | Authenticated | — | `{}` |
| GET | `/auth/me` | Authenticated | — | `{user}` |
| POST | `/auth/change-password` | Authenticated | `{currentPassword,newPassword}` | Success |
| POST | `/uploads` | Authenticated | Multipart `file`, JPEG/PNG/WebP/PDF ≤5 MB | `{url,publicId,name}` |
| GET | `/properties` | Public / optional token | `city,type,minPrice,maxPrice,status,search,minFunding,maxFunding,sort,page,limit` | Paged properties visible to caller |
| GET | `/properties/:id` | Public for LIVE/FUNDED/HOLDING/SOLD; owner/admin otherwise | — | Property with computed fields |
| POST | `/properties` | Approved BROKER / ADMIN | Draft property fields | DRAFT Property (201) |
| PATCH | `/properties/:id` | Owner BROKER / ADMIN | Allowed editable property fields | Property |
| POST | `/properties/:id/submit` | Owner BROKER / ADMIN | — | PENDING_APPROVAL Property |
| POST | `/properties/:id/approve` | ADMIN | — | LIVE Property |
| POST | `/properties/:id/reject` | ADMIN | `{reason}` | REJECTED Property |
| POST | `/properties/:id/status` | ADMIN | `{status:'HOLDING'\|'CANCELLED'}` | Property; cancellation refunds |
| GET | `/properties/:id/investors` | Owner BROKER / ADMIN | — | `{items:[{investorId,name,units,amount,ownershipPct}]}`; broker names masked |
| POST | `/investments` | INVESTOR | `{propertyId,units,idempotencyKey?}` | `{investment,property:{unitsSold,fundingPct,status},walletBalance}` (201) |

## Sign-in role selection

`POST /auth/login` accepts optional `role: "INVESTOR" | "BROKER" | "ADMIN"`. After verifying credentials, the server rejects a mismatched role with 403 and signs a token only for the persisted account role. Omitting the field preserves existing clients. Whitespace surrounding an email is trimmed before validation. The login UI displays errors inline and sends the selected role.
