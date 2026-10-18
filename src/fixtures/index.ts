// Every spec imports `test` and `expect` from here, never from @playwright/test.
//
// API clients:  api (guest), adminApi, supportApi, warehouseApi (tokens saved by the setup project).
// Test data:    shopper, a fresh account per test, made through POST /qa/fixtures/shopper. Shape it per describe
//               block with test.use({ shopperOptions: { cart: [...], storeCredit: '25.00' } }).
// Browser:      signedIn, the same shopper signed in to the shop in this test's browser.
// Pages:        one fixture per page object, so specs never construct them.
import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ApiClient, ok, type Schemas } from '../api/client';
import { cancelOpenOrders } from '../api/endpoints/orders';
import { createShopper, type ShopperOptions } from '../api/endpoints/qa-lab';
import { env } from '../env';
import { DashboardPage } from '../pages/admin/dashboard.page';
import { HeaderComponent } from '../components/header.component';
import { ProductPage } from '../pages/shop/product.page';
import { TOKENS } from '../support/paths';

export type StaffTokens = { admin: string; support: string; warehouse: string };

/** A fixture account, with a client already acting as it. */
export type Shopper = Schemas['ShopperFixture'] & { api: ApiClient };

type WorkerFixtures = {
  apiContext: APIRequestContext;
  staffTokens: StaffTokens;
};

type TestFixtures = {
  api: ApiClient;
  adminApi: ApiClient;
  supportApi: ApiClient;
  warehouseApi: ApiClient;
  shopperOptions: ShopperOptions;
  shopper: Shopper;
  signedIn: Shopper;
  header: HeaderComponent;
  productPage: ProductPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  apiContext: [
    async ({ playwright }, use) => {
      const context = await playwright.request.newContext();
      await use(context);
      await context.dispose();
    },
    { scope: 'worker' },
  ],
  staffTokens: [
    async ({}, use) => {
      await use(JSON.parse(readFileSync(TOKENS, 'utf8')) as StaffTokens);
    },
    { scope: 'worker' },
  ],

  api: async ({ apiContext }, use) => use(new ApiClient(apiContext, env.apiUrl)),
  adminApi: async ({ api, staffTokens }, use) => use(api.as(staffTokens.admin)),
  supportApi: async ({ api, staffTokens }, use) => use(api.as(staffTokens.support)),
  warehouseApi: async ({ api, staffTokens }, use) => use(api.as(staffTokens.warehouse)),

  shopperOptions: [{}, { option: true }],
  shopper: async ({ api, adminApi, shopperOptions }, use) => {
    const made = await createShopper(adminApi, shopperOptions);
    const shopper = { ...made, api: api.as(made.accessToken) };
    await use(shopper);
    // Orders still open hold stock that every other test and shopper shares; cancelling gives it back.
    await cancelOpenOrders(shopper.api);
  },
  signedIn: async ({ page, shopper }, use) => {
    // Through the shop's own /api/v1, so the session cookie is the shop's, exactly as after a real sign-in.
    await ok<unknown>(
      page.request.post('/api/v1/auth/login', {
        data: { email: shopper.customer.email, password: shopper.password },
      }),
    );
    await use(shopper);
  },

  header: async ({ page }, use) => use(new HeaderComponent(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
});

export { expect };
