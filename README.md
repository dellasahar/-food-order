# FoodOrder Test Automation

## Setup

1. Copy `.env.example` to `.env` and set `MYSQL_DATABASE_URL` for local MySQL.
2. Install dependencies with `pnpm install`.
3. Generate Prisma Client with `pnpm prisma:generate`.
4. Apply the schema with `pnpm prisma:migrate`.
5. Seed deterministic catalog data with `pnpm prisma:seed`.

## Test commands

Analisis kebutuhan, state transition, white-box testing, TDD checklist, dan template defect report tersedia di [`docs/testing-analysis.md`](./docs/testing-analysis.md).

- `pnpm test:unit` — Vitest business-rule tests.
- `pnpm test:api` — API route contract tests.
- `pnpm test:bdd` — Cucumber.js BDD scenarios, including a Scenario Outline.
- `pnpm test:e2e` — Cypress browser tests.
- `pnpm test:all` — Unit, API, and BDD suites.
- `pnpm test:e2e:ci` — Starts Next.js and runs Cypress headlessly.

The Cypress suite uses Page Objects in `cypress/support/pages.ts` and stable `data-testid` selectors. The API suite checks status codes, JSON contracts, validation errors, response headers, and a five-second response budget.
