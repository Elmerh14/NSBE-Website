import {
  ApiErrorSchema,
  AuthResponseSchema,
  type CreateEvent,
  DeleteEventResponseSchema,
  EventSchema,
  EventsResponseSchema,
  type LoginRequest,
} from '@nsbe/shared';
import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const configured: unknown = import.meta.env.VITE_API_URL;
  const base = typeof configured === 'string' ? configured.replace(/\/$/, '') : '';
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${base}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });
  if (!response.ok) {
    const result = ApiErrorSchema.safeParse(await response.json().catch((): unknown => null));
    throw new ApiError(
      response.status,
      result.success ? result.data.error.code : 'REQUEST_FAILED',
      result.success
        ? result.data.error.message
        : 'The request could not be completed. Please try again.',
    );
  }
  return schema.parse(response.status === 204 ? undefined : await response.json());
}

export const loadEvents = (signal?: AbortSignal) =>
  request('/api/admin/events', EventsResponseSchema, { signal });
export const signIn = (input: LoginRequest) =>
  request('/api/auth/login', AuthResponseSchema, { method: 'POST', body: JSON.stringify(input) });
export const saveEvent = (id: number | undefined, input: CreateEvent) =>
  request(id === undefined ? '/api/admin/events' : `/api/admin/events/${id}`, EventSchema, {
    method: id === undefined ? 'POST' : 'PATCH',
    body: JSON.stringify(input),
  });
export const removeEvent = (id: number) =>
  request(`/api/admin/events/${id}`, DeleteEventResponseSchema, { method: 'DELETE' });
