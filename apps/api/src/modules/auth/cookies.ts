import type { CookieSerializeOptions } from '@fastify/cookie';

// Cookie names and settings shared by app.ts (JWT plugin config) and the auth routes.
// Kept out of app.ts so feature modules don't import app.ts, which imports them back.
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

// httpOnly: JavaScript can't read them. secure: HTTPS only (browsers allow localhost).
// sameSite strict: never sent on requests started by another site, which blocks CSRF.
const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
} satisfies CookieSerializeOptions;

export const ACCESS_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  path: '/',
  maxAge: ACCESS_TOKEN_TTL_SECONDS,
} satisfies CookieSerializeOptions;

// The refresh cookie is only sent to /api/auth/* (refresh, logout), not on every API call.
export const REFRESH_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_TTL_SECONDS,
} satisfies CookieSerializeOptions;
