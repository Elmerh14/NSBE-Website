import { AuthResponseSchema } from '@nsbe/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch, ApiRequestError, isApiError } from './api';

const USER = {
  id: 1,
  email: 'elmer@example.com',
  name: 'Elmer',
  role: 'SUPER_ADMIN',
  mustChangePassword: false,
} as const;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
}

function unauthorized(): Response {
  return json(401, { error: { code: 'UNAUTHORIZED', message: 'You must be logged in.' } });
}

describe('apiFetch', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  function calledUrls(): string[] {
    return fetchMock.mock.calls.map(([input]) => urlOf(input));
  }

  it('sends cookies and JSON, and parses the response with the schema', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { user: USER }));

    const result = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email: 'elmer@example.com', password: 'pw' },
      schema: AuthResponseSchema,
    });

    expect(result).toEqual({ user: USER });
    const init = fetchMock.mock.calls[0]?.[1];
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'elmer@example.com', password: 'pw' }),
    });
  });

  it('throws an ApiRequestError with the API’s status, code and message', async () => {
    fetchMock.mockResolvedValueOnce(
      json(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }),
    );

    const error = await apiFetch('/api/auth/login', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
    expect(isApiError(error, 'INVALID_CREDENTIALS')).toBe(true);
    // A failed login is a real answer: no refresh attempt.
    expect(calledUrls()).toEqual(['/api/auth/login']);
  });

  it('falls back to UNKNOWN_ERROR when the error body is not in the API shape', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Bad gateway', { status: 502 }));

    await expect(apiFetch('/api/thing')).rejects.toMatchObject({
      status: 502,
      code: 'UNKNOWN_ERROR',
    });
  });

  it('returns undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiFetch('/api/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('on a 401, refreshes the session once and retries the request', async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(json(200, { user: USER }))
      .mockResolvedValueOnce(json(200, { user: USER }));

    const result = await apiFetch('/api/auth/me', { schema: AuthResponseSchema });

    expect(result).toEqual({ user: USER });
    expect(calledUrls()).toEqual(['/api/auth/me', '/api/auth/refresh', '/api/auth/me']);
  });

  it('gives up with the 401 when the refresh fails too', async () => {
    fetchMock.mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(unauthorized());

    await expect(apiFetch('/api/auth/me')).rejects.toMatchObject({ status: 401 });
    expect(calledUrls()).toEqual(['/api/auth/me', '/api/auth/refresh']);
  });

  it('shares one refresh between requests that hit a 401 at the same time', async () => {
    fetchMock.mockImplementation((input) => {
      const url = urlOf(input);
      if (url === '/api/auth/refresh') return Promise.resolve(json(200, { user: USER }));
      const alreadyRefreshed = calledUrls().includes('/api/auth/refresh');
      return Promise.resolve(alreadyRefreshed ? json(200, {}) : unauthorized());
    });

    await Promise.all([apiFetch('/api/admin/a'), apiFetch('/api/admin/b')]);

    expect(calledUrls().filter((url) => url === '/api/auth/refresh')).toHaveLength(1);
  });
});
