import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { ApiError } from '@nsbe/shared';
import Fastify, { type FastifyError } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import type { Config } from './config';
import { AppError } from './lib/errors';
import { createPrismaClient } from './lib/prisma';
import { adminRoutes } from './modules/admin/routes';
import { ACCESS_TOKEN_COOKIE } from './modules/auth/cookies';
import { toCurrentUser } from './modules/auth/jwt';
import { authRoutes } from './modules/auth/routes';
import { eventsRoutes } from './modules/events/routes';
import { settingsRoutes } from './modules/settings/routes';

// Fastify's own client errors (bad JSON, payload too large, ...) carry a 4xx status.
function isFastifyClientError(error: unknown): error is FastifyError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof error.statusCode === 'number' &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  );
}

function errorBody(code: string, message: string): ApiError {
  return { error: { code, message } };
}

export async function buildApp(config: Config) {
  const app = Fastify({ logger: { level: config.LOG_LEVEL } }).withTypeProvider<ZodTypeProvider>();

  // Validate requests and serialize responses with the zod schemas from @nsbe/shared.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // One client (and connection pool) for the whole app. Routes use `app.prisma` and pass it to services.
  const prisma = createPrismaClient(config.DATABASE_URL);
  app.decorate('prisma', prisma);
  app.addHook('onClose', () => prisma.$disconnect());

  await app.register(cookie);
  // request.jwtVerify() reads the access token from this cookie and sets request.user to { id, role }.
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    cookie: { cookieName: ACCESS_TOKEN_COOKIE, signed: false },
    formatUser: toCurrentUser,
  });

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send(errorBody('VALIDATION_ERROR', error.message));
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(errorBody(error.code, error.message));
    }
    if (isFastifyClientError(error)) {
      return reply.status(error.statusCode ?? 400).send(errorBody(error.code, error.message));
    }
    request.log.error(error);
    return reply.status(500).send(errorBody('INTERNAL_ERROR', 'Something went wrong'));
  });

  app.setNotFoundHandler((request, reply) =>
    reply
      .status(404)
      .send(errorBody('NOT_FOUND', `Route ${request.method} ${request.url} not found`)),
  );

  app.get('/api/health', () => ({ status: 'ok' }));

  await app.register(authRoutes);
  await app.register(eventsRoutes);
  await app.register(settingsRoutes);
  // All /api/admin/* routes live inside this plugin, behind requireAuth.
  await app.register(adminRoutes);

  return app;
}
