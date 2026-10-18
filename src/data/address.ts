// Address builders for tests that type an address into a form or send one to the API.
import { fakerEN_US as faker } from '@faker-js/faker';

/** A US address in the shape POST /account/addresses takes. Every field can be overridden. */
export const usAddress = (overrides: Partial<UsAddress> = {}): UsAddress => ({
  name: faker.person.fullName(),
  line1: faker.location.streetAddress(),
  city: faker.location.city(),
  region: faker.location.state({ abbreviated: true }),
  postcode: faker.location.zipCode('#####'),
  countryCode: 'US',
  ...overrides,
});

export type UsAddress = {
  name: string;
  line1: string;
  city: string;
  region: string;
  postcode: string;
  countryCode: string;
};
