// A product page: /products/:slug.
import { expect, type Locator, type Page } from '@playwright/test';

export class ProductPage {
  private readonly title: Locator;
  private readonly addToCartButton: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByRole('heading', { level: 1 });
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart', exact: true });
  }

  async goto(slug: string) {
    await this.page.goto(`/products/${slug}`);
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async expectTitle(name: string) {
    await expect(this.title).toHaveText(name);
  }

  async expectCanBuy() {
    await expect(this.addToCartButton).toBeEnabled();
  }
}
