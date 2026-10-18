import { ok, type ApiClient, type Schemas } from '../client';

const OPEN = new Set(['pending_payment', 'confirmed']);

/** Cancels every order of this shopper that can still be cancelled, so test orders don't keep holding stock. */
export async function cancelOpenOrders(shopper: ApiClient) {
  const orders = await ok<{ items: Schemas['OrderSummary'][] }>(shopper.get('/orders', { params: { limit: 50 } }));
  for (const order of orders.items.filter((o) => OPEN.has(o.status))) {
    await ok<unknown>(shopper.post(`/orders/${order.id}/cancel`, { reason: 'other', note: 'halden-qa test cleanup' }));
  }
}
