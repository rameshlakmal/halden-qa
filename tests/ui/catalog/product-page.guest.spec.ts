import { wellStockedProduct } from '../../../src/api/endpoints/catalog';
import { test } from '../../../src/fixtures';

test.describe('Product page', () => {
  test('Verify that a guest can open a product and buy it', { tag: '@smoke' }, async ({ api, productPage }) => {
    const product = await wellStockedProduct(api);

    await productPage.goto(product.slug);

    await productPage.expectTitle(product.name);
    await productPage.expectCanBuy();
  });
});
