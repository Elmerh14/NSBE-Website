import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

// Prisma 7 talks to Postgres through a driver adapter; this one uses node-postgres (pg).
export function createPrismaClient(databaseUrl: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

declare module 'fastify' {
  // Module augmentation only works with an interface: it merges into Fastify's own declaration.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
