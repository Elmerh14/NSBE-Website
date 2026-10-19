import { ApiErrorSchema } from '@nsbe/shared';
import type { z } from 'zod';

// In dev this is empty: Vite forwards /api to the local API (see vite.config.ts).
// In production it's the API's own domain.
const API_URL = import.meta.env.VITE_API_URL ?? '';

// Thrown for any non-2xx response. `code` is the API's error code, e.g. INVALID_CREDENTIALS.
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function isApiError(error: unknown, code?: string): error is ApiRequestError {
  return error instanceof ApiRequestError && (code === undefined || error.code === code);
}

type ApiFetchOptions<T> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  // Validates the response, so the result is typed and a wrong shape fails loudly.
  schema?: z.ZodType<T>;
};

// Auth routes where a 401 is a real answer, not "access token expired".
const NO_REFRESH_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];

let refreshInFlight: Promise<boolean> | null = null;

// Asks the API for new cookies using the refresh cookie. Several requests can hit a 401 at the
// same moment; they all share one refresh call, because each refresh token works only once.
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function send(path: string, method: string, body: unknown): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method,
    // Send and receive the auth cookies. Tokens are never read or stored by JavaScript.
    credentials: 'include',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function toError(res: Response): Promise<ApiRequestError> {
  const parsed = ApiErrorSchema.safeParse(await res.json().catch(() => null));
  return parsed.success
    ? new ApiRequestError(res.status, parsed.data.error.code, parsed.data.error.message)
    : new ApiRequestError(res.status, 'UNKNOWN_ERROR', 'Something went wrong');
}

// Every admin request to the API goes through here.
// On a 401 it refreshes the session once and retries, so users aren't logged out every 15 minutes.
export async function apiFetch<T = void>(
  path: string,
  { method = 'GET', body, schema }: ApiFetchOptions<T> = {},
): Promise<T> {
  let res = await send(path, method, body);

  if (res.status === 401 && !NO_REFRESH_PATHS.includes(path) && (await refreshSession())) {
    res = await send(path, method, body);
  }

  if (!res.ok) {
    throw await toError(res);
  }

  if (res.status === 204 || !schema) {
    return undefined as T;
  }

  return schema.parse(await res.json());
}
