# Contributing to EstatePortal

Thanks for your interest. EstatePortal is an academic project: a fractional
real estate investment portal built with Next.js, React, and MongoDB.

## Getting started

Requirements: Node.js 18.18 or newer, npm, and a MongoDB connection (Atlas or
a local replica set, which is needed for transactions).

1. Fork and clone the repository.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your own values. Never
   commit `.env.local`.
4. Seed demo data: `npm run seed -- --reset-demo`
5. Start the app: `npm run dev` and open http://localhost:3000

## Scripts

- `npm run dev` start the dev server
- `npm run build` production build and type check
- `npm test` run the vitest suite
- `npm run seed -- --reset-demo` reset and seed demo data
- `npm run concurrency` run the anti-oversell proof

## Workflow

1. Create a branch from `main`, for example `fix/wallet-rounding`.
2. Make small, focused commits. Conventional Commit style is preferred, for
   example `fix(invest): clamp units to remaining supply`.
3. Run `npm run build` and `npm test` before opening a pull request.
4. Open a pull request against `main` and fill in the template.

## Code conventions

- TypeScript throughout. Match the style of the files you touch.
- Keep changes scoped. Avoid unrelated reformatting.
- Validate input at trust boundaries and handle errors rather than swallowing
  them.

## Domain rules that must hold

- All money is stored as integer paise. Never use floating point for money.
- The wallet balance changes only through `ledger.post`, inside a transaction.
- Property status follows the lifecycle state machine; illegal transitions are
  rejected.
- The payment gateway is mocked. Do not add real payment network calls.

## Reporting issues

Use the issue templates. For security problems follow SECURITY.md instead of
opening a public issue.
