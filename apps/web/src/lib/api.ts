import type { z } from 'zod';

// In dev this is empty: Vite forwards /api to the local API (see vite.config.ts).
// In production it's the API's own domain.
const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiRequestError extends Error {
  constructor(readonly status: number) {
    super(`Request failed with status ${String(status)}`);
    this.name = 'ApiRequestError';
  }
}

// The public site only reads public endpoints: no cookies, no refresh, just GET + validate.
export async function apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new ApiRequestError(res.status);
  return schema.parse(await res.json());
}
