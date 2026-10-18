import { ok, type ApiClient, type Schemas } from '../client';

/** A Bearer token for an account. Each call is a sign-in, which is rate-limited: fetch tokens once and reuse them. */
export const signIn = (api: ApiClient, email: string, password: string) =>
  ok<Schemas['AccessToken']>(api.as(undefined).post('/auth/token', { email, password }));
