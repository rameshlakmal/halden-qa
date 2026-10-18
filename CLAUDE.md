# halden-qa: rules for writing tests

These rules apply to everyone who writes or changes code here: people, Claude sessions and the Planner, Generator and
Healer agents. The most important ones are also enforced by lint (`eslint.config.mjs`), an edit hook
(`.claude/hooks/guard-edit.mjs`) and the CI assertion guard (`scripts/guard-assertions.ts`). Change a rule here
first, then the code.

The system under test is the Halden shop (shop, admin and API). Its business rules are in the shop repo's
`docs/DESIGN.md` and `docs/API-TESTING.md`.

---

## Assertions are sacred

1. **Never remove, loosen or change an assertion to make a test pass.** A failing test means one of four things: a
   product bug, an outdated test, a timing problem, or an environment or data problem. Find out which.
2. If the test is right and the app is wrong, **report a suspected bug**: the test, the rule it covers, what was
   expected, what happened, and the trace. Leave the test failing.
3. An assertion changes only when a business rule changes. Then update `specs/<feature>/rules.md` first, and add a
   commit message line `rule-change: <rule id> <why>`. The CI guard fails without it.
4. **No `test.skip`, `test.fixme`, `test.only` or `test.fail`.** No fixed waits (`waitForTimeout`), no `force: true`,
   no `networkidle`. No eslint-disable for a Playwright rule.
5. Assert the **business outcome**, not only that something appeared: amounts, stock, states, saved data. A UI test
   that changes data also checks the data through the API (see `tests/ui/cart/add-to-cart.customer.spec.ts`).

---

## Structure

```
specs/<feature>/rules.md       R-ids, written from business rules, never from what the screen shows
specs/<feature>/testplan.md    case ids; each case lists the rules it covers
src/api/client.ts              ApiClient (raw responses) and ok() (setup helper that throws)
src/api/endpoints/*.ts         typed helpers for the arrange step
src/api/schema.d.ts            generated: npm run api:types. Never edit by hand
src/fixtures/index.ts          all fixtures; exports test and expect
src/pages/shop/*.page.ts       shop page objects
src/pages/admin/*.page.ts      admin page objects
src/components/*.component.ts  parts shared by several pages (header, cart drawer)
src/support/                   paths, QA lab helpers
tests/setup/                   the setup project only
tests/api/<feature>/*.spec.ts  API tests
tests/ui/<feature>/<name>.<role>.spec.ts   UI tests; the suffix picks the Playwright project
tests/journeys/                end-to-end flows across shop, admin and API
tests/checks/                  contract, accessibility, visual
scripts/                       guard, api types, later the bug proof
```

- One folder per feature under `tests/api` and `tests/ui`. Files no deeper than that.
- Keep files small: a page object over ~250 lines becomes components; a spec over ~300 lines splits by sub-feature.

---

## Which layer

- Business rules (money, stock, states, limits, roles, errors) are tested through the **API**.
- The **UI** proves a person can do the task and sees the right result. Don't repeat in the UI what the API test
  already proves.
- A **journey** crosses apps (buy in the shop, ship in the admin, refund seen by the shopper). Keep them few.

---

## Test data and logins

- Every test that changes data gets **its own account** through the `shopper` fixture (`POST /qa/fixtures/shopper`).
  Shape it with `test.use({ shopperOptions: { cart, storeCredit, points } })`. Never use the seeded demo accounts
  (maya@, jonas@, ari@halden.test) in tests.
- Pick products at run time (`wellStockedProduct`). Stock is shared; never hard-code a product a test could sell out.
- API tests use `api` (guest), `shopper.api`, `adminApi`, `supportApi`, `warehouseApi`. Never sign in per test:
  sign-ins are rate-limited.
- UI tests for customers use `signedIn`. Staff UI tests get their login from the project's `storageState`.
  Only login tests use the login form.
- Emails: `inbox()` in `src/api/endpoints/qa-lab.ts`.
- The shop clock and the planted bugs are shared by the whole shop. A test that changes either is tagged `@clock`,
  and puts them back in `afterEach`.
- Test data that has to look like real input (names, addresses) comes from builders in `src/data/` (Faker).

---

## Specs (test files)

- Import `test` and `expect` from `src/fixtures`, never from `@playwright/test`.
- No locators, no `page.*` calls, no data generation in specs. Lint enforces this.
- Titles are a plain sentence about the business outcome: `Verify that a declined card cancels the order and keeps
  the cart`. Not `test checkout 402`.
- One behaviour per test: arrange, act once, assert the outcome. If the title needs "and" for two separate
  behaviours, split it.
- Use `test.beforeEach` for shared arrange steps, and `test.describe` per behaviour group.
- Tags, as Playwright tags (`{ tag: [...] }`):
  - `@smoke` a few critical paths, run on every pull request
  - `@rule:R-CHK-03` the rule a test covers (every test from milestone 2 on)
  - `@bug:<key>` the planted bug a test must catch
  - `@clock` changes the shop clock or bugs; runs alone, last
- Comments explain why, never what.

---

## Page objects

Layout, in this order:

```ts
export class CheckoutPage {
  // 1. static locators: private readonly, set in the constructor
  // 2. private methods that return dynamic locators (take a parameter, never cached)
  // 3. navigation: goto()
  // 4. actions: verbs, no assertions inside
  // 5. assertions: methods named expect*, using expect from @playwright/test
}
```

Locator priority. Stop at the first that works:

1. `getByRole` with the accessible name
2. `getByLabel`
3. `getByPlaceholder`
4. `getByText`, for non-interactive text
5. `getByTestId`. If you need one that doesn't exist, add it to `specs/testid-requests.md`
6. CSS: last resort, with an `eslint-disable-next-line playwright/no-raw-locators -- <why>` comment

No XPath. No `.nth()`, `.first()` or `.last()`: scope the locator to a landmark or region instead (lint enforces
it). Wait for a state (`waitFor({ state })`, `waitForResponse`) or let Playwright auto-wait.

---

## API tests

- Act and assert on the raw response from `ApiClient`: `expect(res.status()).toBe(409)`, then the body.
- Use the typed helpers (`createShopper`, `placeOrder`, `ok()`) only to arrange.
- Assert on `status` and `code` for errors; never on `detail`, which is wording for people.
- Money is a string with two decimals: compare strings, or convert to cents. Never floats.
- Type bodies with `Schemas['Name']` from `src/api/client.ts`.

---

## Before writing a test

1. Is the case in `specs/<feature>/testplan.md`? Which rules does it cover?
2. Which layer and which role?
3. Do the page object, fixture and helper you need exist? Extend them instead of duplicating.
4. Run it, and see it fail for the right reason at least once (switch the planted bug on, or break the expectation
   locally and put it back).
5. Run `npm run lint`, `npm run typecheck` and `npm run guard` before committing.

---

## Running

```
npm test                     everything (setup, api, ui-*, then clock)
npm run test:smoke           @smoke only
npx playwright test --project=api
npx playwright test --ui     interactive
```

`.env` holds the URLs and the admin password (see `.env.example`). It is gitignored; CI uses secrets.
