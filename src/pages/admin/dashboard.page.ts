// The admin's start page: /.
import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  private readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Dashboard', level: 1 });
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async expectSignedInAs(roleLabel: string) {
    await expect(this.page.getByRole('banner').getByText(roleLabel, { exact: true })).toBeVisible();
  }
}
