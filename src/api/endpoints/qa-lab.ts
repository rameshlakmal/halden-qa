// The QA lab: test data, the shop clock, the planted bugs and the fake inbox. All but the inbox need an admin token.
import { ok, type ApiClient, type Schemas } from '../client';

export type ShopperOptions = {
  name?: string;
  role?: 'customer' | 'support' | 'warehouse';
  emailVerified?: boolean;
  address?: boolean;
  cart?: { slug: string; qty: number }[];
  storeCredit?: string;
  points?: number;
};

export const createShopper = (admin: ApiClient, options: ShopperOptions = {}) =>
  ok<Schemas['ShopperFixture']>(admin.post('/qa/fixtures/shopper', options), [201]);

export const resetQaLab = (admin: ApiClient) => ok<Schemas['QaReset']>(admin.post('/qa/reset'));

export const setClock = (admin: ApiClient, offsetSeconds: number) =>
  ok<Schemas['Clock']>(admin.put('/qa/clock', { offsetSeconds }));

export const setBug = (admin: ApiClient, key: string, enabled: boolean) =>
  ok<unknown>(admin.put(`/qa/bugs/${key}`, { enabled }));

/** Emails sent to an address, newest first. */
export const inbox = async (api: ApiClient, email: string) =>
  (await ok<{ items: Schemas['InboxEmail'][] }>(api.get('/qa/inbox', { params: { email } }))).items;
