// The shop's top bar, on every shop page.
import { expect, type Locator, type Page } from '@playwright/test';

export class HeaderComponent {
  private readonly cartButton: Locator;
  private readonly cartDrawer: Locator;

  constructor(private readonly page: Page) {
    this.cartButton = page.getByRole('button', { name: /^Open cart, \d+ items?$/ });
    this.cartDrawer = page.getByRole('dialog', { name: 'Your cart' });
  }

  async openCart() {
    await this.cartButton.click();
    await this.cartDrawer.waitFor({ state: 'visible' });
  }

  async expectCartCount(count: number) {
    await expect(this.cartButton).toHaveAccessibleName(`Open cart, ${count} item${count === 1 ? '' : 's'}`);
  }

  async expectCartDrawerLists(productName: string) {
    await expect(this.cartDrawer.getByText(productName, { exact: true })).toBeVisible();
  }
}
