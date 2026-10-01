# Security Policy

## Supported versions

This is an academic project. Security fixes are applied to the latest `main`
only.

| Version | Supported |
| ------- | --------- |
| main    | yes       |
| older   | no        |

## Reporting a vulnerability

Please do not open a public issue for security problems.

Use GitHub's private vulnerability reporting on this repository:
Security tab, then "Report a vulnerability". If that is unavailable, contact
the maintainer privately through [@0xarchit](https://github.com/0xarchit).

When you report, include:

- A clear description of the issue and its impact
- Steps to reproduce or a proof of concept
- Affected files, routes, or versions

You can expect an acknowledgement within a few days. Once a fix is ready it
will land on `main` and the report will be credited unless you prefer to stay
anonymous.

## Scope and notes

This project uses a mock payment gateway and seeded demo data. No real money,
real payments, or production secrets are involved. Treat `.env.local` values
as local-only and never commit them.
