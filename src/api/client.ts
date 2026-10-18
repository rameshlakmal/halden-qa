// A thin client over Playwright's request context, so every call shows up in the trace of a failing test.
// Two kinds of use:
//   - In the act and assert steps, tests call get/post/... and assert on the raw response (status, headers, body).
//   - In the arrange step, tests use the typed helpers in ./endpoints, which throw on anything unexpected.
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import type { components } from './schema';

export type Schemas = components['schemas'];
export type Problem = Schemas['Problem'];

type Options = {
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  /** Sends a fresh Idempotency-Key, as checkout and refunds require. */
  idempotent?: boolean;
};

export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    readonly baseUrl: string,
    readonly token?: string,
  ) {}

  /** The same client acting as someone else (a token from /auth/token or a fixture), or as a guest. */
  as(token: string | undefined): ApiClient {
    return new ApiClient(this.request, this.baseUrl, token);
  }

  get = (path: string, options?: Options) => this.send('GET', path, options);
  post = (path: string, data?: unknown, options?: Options) => this.send('POST', path, { ...options, data: data ?? {} });
  put = (path: string, data?: unknown, options?: Options) => this.send('PUT', path, { ...options, data: data ?? {} });
  patch = (path: string, data?: unknown, options?: Options) => this.send('PATCH', path, { ...options, data: data ?? {} });
  delete = (path: string, options?: Options) => this.send('DELETE', path, options);

  private send(method: string, path: string, options: Options = {}): Promise<APIResponse> {
    return this.request.fetch(`${this.baseUrl}/api/v1${path}`, {
      method,
      params: options.params,
      data: options.data,
      headers: {
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
        ...(options.idempotent ? { 'idempotency-key': randomUUID() } : {}),
        ...options.headers,
      },
      // Tests decide what a status means; the client never throws on 4xx or 5xx.
      failOnStatusCode: false,
    });
  }
}

/**
 * For the arrange step: the body of a successful response, or an error that says what the API answered.
 * Never use it on the call a test is about; assert on that response directly.
 */
export async function ok<T>(response: Promise<APIResponse> | APIResponse, expected = [200, 201, 202]): Promise<T> {
  const res = await response;
  if (!expected.includes(res.status())) {
    const body = await res.text();
    throw new Error(`Setup call ${res.url()} answered ${res.status()}: ${body.slice(0, 500)}`);
  }
  return (await res.json()) as T;
}
