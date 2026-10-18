import type { Schemas } from '../../../src/api/client';
import { wellStockedProduct } from '../../../src/api/endpoints/catalog';
import { expect, test } from '../../../src/fixtures';

test.describe('Adding to the cart', () => {
  test(
    'Verify that adding a product updates the cart button and the saved cart',
    { tag: '@smoke' },
    async ({ api, signedIn, productPage, header }) => {
      const product = await wellStockedProduct(api);
      await productPage.goto(product.slug);

      await productPage.addToCart();

      await header.expectCartCount(1);
      // The screen is not the whole story: the cart must also be saved on the account.
      const cart = (await (await signedIn.api.get('/cart')).json()) as Schemas['Cart'];
      expect(cart.lines).toEqual([expect.objectContaining({ productId: product.id, qty: 1 })]);
    },
  );
});
