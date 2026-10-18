import type { Schemas } from '../../../src/api/client';
import { expect, test } from '../../../src/fixtures';

test.describe('Product list', () => {
  test('Verify that a category filter returns only products from that category', { tag: '@smoke' }, async ({ api }) => {
    const res = await api.get('/products', { params: { category: 'shelter', limit: 48 } });

    expect(res.status()).toBe(200);
    const page = (await res.json()) as Schemas['ProductPage'];
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((p) => p.category.slug === 'shelter')).toBe(true);
    expect(page.total).toBe(page.items.length);
  });

  test('Verify that prices are strings with two decimals', { tag: '@smoke' }, async ({ api }) => {
    const page = (await (await api.get('/products', { params: { limit: 48 } })).json()) as Schemas['ProductPage'];

    for (const product of page.items) expect(product.price, product.slug).toMatch(/^\d+\.\d{2}$/);
  });

  test('Verify that an unknown product answers 404 not_found as problem+json', async ({ api }) => {
    const res = await api.get('/products/no-such-product');

    expect(res.status()).toBe(404);
    expect(res.headers()['content-type']).toMatch(/^application\/problem\+json/);
    expect(((await res.json()) as Schemas['Problem']).code).toBe('not_found');
  });
});
