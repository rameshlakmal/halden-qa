# halden-qa

The QA-owned Playwright suite for [Halden Outfitters](https://github.com/rameshlakmal/halden-outfitters): the shop,
its admin and its API. It is also an experiment: the same architecture, with tests written by hand and with an AI
workflow (Planner, Generator, Healer), measured against the shop's 18 planted bugs.

## Layout

| Path | What |
|---|---|
| `CLAUDE.md` | The rules for writing tests. Read it first |
| `specs/<feature>/` | `rules.md` (what correct means) and `testplan.md` (the cases) |
| `src/api/` | `ApiClient`, typed helpers, and types generated from the API's OpenAPI spec |
| `src/fixtures/` | All fixtures: API clients per role, a fresh `shopper` per test, `signedIn`, page objects |
| `src/pages/`, `src/components/` | Page objects for the shop and the admin |
| `tests/api`, `tests/ui` | Tests by layer, then by feature. UI files end in their role: `.guest`, `.customer`, `.admin`… |
| `scripts/guard-assertions.ts` | Fails a change that removes assertions or adds skips |

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then fill in HALDEN_ADMIN_PASSWORD
```

By default the suite runs against the live sites. To run against a local Halden, point `SHOP_URL`, `ADMIN_URL`
and `API_URL` at it.

## Running

```bash
npm test                 # everything
npm run test:smoke       # @smoke only
npm run test:api         # the API layer
npx playwright test --ui
npm run lint && npm run typecheck && npm run guard
npm run api:types        # refresh src/api/schema.d.ts after the API changes
```

The setup project runs first: it resets the QA lab, gets the admin a token (reused while it still works, because
sign-ins are rate-limited), and makes this run's support and warehouse accounts. Tests tagged `@clock` change the
shop-wide clock or bugs, so they run alone, after the rest.

## Guardrails

The important rules in `CLAUDE.md` are enforced, not just written down:

- **Lint** bans skipped and focused tests, fixed waits, `force: true`, positional locators, and locators or raw page
  calls in spec files.
- **An edit hook** (`.claude/hooks/guard-edit.mjs`) stops an AI agent's edit that removes an assertion or adds a skip.
- **The CI guard** fails a pull request that removes or changes an assertion, unless a commit explains the rule
  change with a `rule-change:` line.

## CI

`.github/workflows/pr.yml` builds Halden from its repo against a throwaway Postgres, starts the API, shop and admin,
and runs lint, typecheck, the guard and the `@smoke` tests. The report is uploaded as an artifact.
