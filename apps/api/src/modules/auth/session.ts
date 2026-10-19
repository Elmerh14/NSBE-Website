import type { AuthUser } from '@nsbe/shared';
import type { FastifyReply } from 'fastify';

import {
  ACCESS_COOKIE_OPTIONS,
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
} from './cookies';
import type { AccessTokenPayload } from './jwt';

// Signs a new access token and sets both session cookies on the response.
// Used by login, refresh and change-password.
export async function setSessionCookies(
  reply: FastifyReply,
  user: AuthUser,
  refreshToken: string,
): Promise<void> {
  const payload: AccessTokenPayload = { sub: String(user.id), role: user.role };
  const accessToken = await reply.jwtSign(payload, {
    expiresIn: `${String(ACCESS_TOKEN_TTL_SECONDS)}s`,
  });

  reply.setCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_COOKIE_OPTIONS);
  reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
}

// Logout. The path must match the one each cookie was set with, or the browser keeps it.
export function clearSessionCookies(reply: FastifyReply): void {
  reply.clearCookie(ACCESS_TOKEN_COOKIE, { path: ACCESS_COOKIE_OPTIONS.path });
  reply.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_COOKIE_OPTIONS.path });
}
