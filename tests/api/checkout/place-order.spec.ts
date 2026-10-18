import type { Schemas } from '../../../src/api/client';
import { wellStockedProduct } from '../../../src/api/endpoints/catalog';
import { card } from '../../../src/api/endpoints/checkout';
import { expect, test } from '../../../src/fixtures';

test.describe('Placing an order', () => {
  test.beforeEach(async ({ api, shopper }) => {
    const product = await wellStockedProduct(api);
    const res = await shopper.api.post('/cart/items', { productId: product.id, qty: 1 });
    expect(res.status()).toBe(200);
  });

  test('Verify that an approved card confirms the order and empties the cart', { tag: '@smoke' }, async ({ shopper }) => {
    const res = await shopper.api.post(
      '/checkout',
      { shipTo: { addressId: shopper.address!.id }, shippingMethod: 'standard', card: card() },
      { idempotent: true },
    );

    expect(res.status()).toBe(201);
    const result = (await res.json()) as Schemas['CheckoutResult'];
    expect(result).toMatchObject({ status: 'confirmed', nextAction: null });
    const cart = (await (await shopper.api.get('/cart')).json()) as Schemas['Cart'];
    expect(cart.itemCount).toBe(0);
  });

  test('Verify that checkout without an Idempotency-Key is refused', async ({ shopper }) => {
    const res = await shopper.api.post('/checkout', { shipTo: { addressId: shopper.address!.id }, card: card() });

    expect(res.status()).toBe(400);
    expect(((await res.json()) as Schemas['Problem']).code).toBe('idempotency_key_missing');
  });
});
