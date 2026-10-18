import { ok, type ApiClient, type Schemas } from '../client';

/** Test cards from the HaldenPay sandbox: any future expiry and any CVC work. */
export const CARDS = {
  approved: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  needsBankStep: '4000000000003220',
  disputedAfterCapture: '4000000000000259',
} as const;

export const card = (number: string = CARDS.approved) => ({
  number,
  expMonth: 12,
  expYear: new Date().getFullYear() + 3,
  cvc: '123',
  name: 'Test Shopper',
});

/** Places an order with the approved card, for tests whose subject comes after the purchase. */
export const placeOrder = (shopper: ApiClient, addressId: string, shippingMethod: 'standard' | 'express' = 'standard') =>
  ok<Schemas['CheckoutResult']>(
    shopper.post('/checkout', { shipTo: { addressId }, shippingMethod, card: card() }, { idempotent: true }),
    [201],
  );
