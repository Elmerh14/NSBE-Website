import path from 'node:path';

import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: path.resolve(import.meta.dirname, '../../.env'), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // The Prisma CLI (migrations) uses the DIRECT Neon connection, not the pooled one.
    url: process.env.DIRECT_URL ?? '',
  },
});
