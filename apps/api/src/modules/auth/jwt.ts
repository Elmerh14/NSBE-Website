import type { Role } from '@nsbe/shared';

// What the login route signs into the access token. `sub` is a string because the JWT spec says so.
export type AccessTokenPayload = {
  sub: string;
  role: Role;
};

// What routes read from `request.user` after requireAuth: the id is turned back into a number for Prisma.
export type CurrentUser = {
  id: number;
  role: Role;
};

// Passed to @fastify/jwt as `formatUser`, so jwtVerify() sets request.user to a CurrentUser.
export function toCurrentUser(payload: AccessTokenPayload): CurrentUser {
  return { id: Number(payload.sub), role: payload.role };
}

declare module '@fastify/jwt' {
  // Module augmentation only works with an interface: it merges into @fastify/jwt's own declaration.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: CurrentUser;
  }
}
