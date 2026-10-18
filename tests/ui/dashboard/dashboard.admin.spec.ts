import { test } from '../../../src/fixtures';

test.describe('Admin dashboard', () => {
  test('Verify that an admin lands on the dashboard', { tag: '@smoke' }, async ({ dashboardPage }) => {
    await dashboardPage.goto();

    await dashboardPage.expectLoaded();
    await dashboardPage.expectSignedInAs('Admin');
  });
});
