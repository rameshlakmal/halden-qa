import { ok, type ApiClient, type Schemas } from '../client';

/**
 * A product with plenty of stock, chosen at run time. Stock is shared by every test and every shopper on the live
 * site, so tests never hard-code a product whose units they might run out of.
 */
export async function wellStockedProduct(api: ApiClient): Promise<Schemas['ProductCard']> {
  const page = await ok<Schemas['ProductPage']>(api.get('/products', { params: { inStock: true, limit: 48 } }));
  const product = page.items.find((p) => p.availability.status === 'in_stock');
  if (!product) throw new Error('No product is comfortably in stock. Restock through the admin before running.');
  return product;
}
