// Creates the first SUPER_ADMIN, since there is no public sign-up.
// Usage (from the repo root): pnpm --filter api seed:admin --email you@example.com --name "Your Name"
// The database is whichever DATABASE_URL is in .env, so check it points at your own dev branch.
import { parseArgs } from 'node:util';

import { z } from 'zod';

import { loadConfig } from '../config';
import { createPrismaClient } from '../lib/prisma';
import { createSuperAdmin, SuperAdminInputSchema } from './create-super-admin';

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
  },
});

const parsed = SuperAdminInputSchema.safeParse(values);
if (!parsed.success) {
  console.error(`Invalid arguments:\n${z.prettifyError(parsed.error)}`);
  console.error('Usage: pnpm --filter api seed:admin --email you@example.com --name "Your Name"');
  process.exit(1);
}

const config = loadConfig();
const prisma = createPrismaClient(config.DATABASE_URL);

try {
  const { user, temporaryPassword } = await createSuperAdmin(prisma, parsed.data);
  console.log(`Created SUPER_ADMIN #${String(user.id)}: ${user.name} <${user.email}>`);
  console.log(`Temporary password (shown once, not stored): ${temporaryPassword}`);
  console.log('They will be asked to change it after logging in.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
