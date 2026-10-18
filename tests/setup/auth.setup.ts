// Runs once before every other project:
//   1. Puts the QA lab back to the start (clock, bugs, unused fixture accounts).
//   2. Gets the admin a Bearer token, reusing last run's while it still works (sign-ins are rate-limited).
//   3. Makes this run's support and warehouse accounts, and saves a token and an admin-app login for each staff role.
import { request as playwrightRequest, test as setup } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ApiClient, ok, type Schemas } from '../../src/api/client';
import { signIn } from '../../src/api/endpoints/auth';
import { createShopper, resetQaLab } from '../../src/api/endpoints/qa-lab';
import { env } from '../../src/env';
import { AUTH_DIR, STATE, TOKENS } from '../../src/support/paths';
import type { StaffTokens } from '../../src/fixtures';

setup('prepare the QA lab and the staff logins', async ({ browser }) => {
  mkdirSync(AUTH_DIR, { recursive: true });
  const request = await playwrightRequest.newContext();
  const api = new ApiClient(request, env.apiUrl);

  const adminToken = await reusableAdminToken(api);
  const admin = api.as(adminToken);
  await resetQaLab(admin);

  const tokens: StaffTokens = { admin: adminToken, support: '', warehouse: '' };
  const passwords: Record<string, { email: string; password: string }> = {
    admin: { email: env.admin.email, password: env.admin.password },
  };
  for (const role of ['support', 'warehouse'] as const) {
    const staff = await createShopper(admin, { role, name: `QA ${role}`, address: false });
    tokens[role] = staff.accessToken;
    passwords[role] = { email: staff.customer.email, password: staff.password };
  }
  writeFileSync(TOKENS, JSON.stringify(tokens, null, 2));

  // A browser login per staff role, through the admin app's own /api/v1, so the cookie lands on the admin's domain.
  for (const role of ['admin', 'support', 'warehouse'] as const) {
    const context = await browser.newContext({ baseURL: env.adminUrl });
    await ok<unknown>(context.request.post('/api/v1/auth/login', { data: passwords[role] }));
    await context.storageState({ path: STATE[role] });
    await context.close();
  }
  await request.dispose();
});

async function reusableAdminToken(api: ApiClient): Promise<string> {
  try {
    const saved = (JSON.parse(readFileSync(TOKENS, 'utf8')) as StaffTokens).admin;
    const session = await ok<Schemas['SessionState']>(api.as(saved).get('/auth/session'));
    if (session.customer?.role === 'admin') return saved;
  } catch {
    // No saved token, or it no longer works: sign in again below.
  }
  return (await signIn(api, env.admin.email, env.admin.password)).accessToken;
}
