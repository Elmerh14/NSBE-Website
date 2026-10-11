import { ApiErrorSchema } from '@nsbe/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { buildApp } from './app';
import { AppError } from './lib/errors';
import { TEST_CONFIG } from './test-config';

describe('app', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp(TEST_CONFIG);
    app.post(
      '/test/validated',
      { schema: { body: z.object({ name: z.string().min(1) }) } },
      (request) => ({ hello: request.body.name }),
    );
    app.get('/test/app-error', () => {
      throw new AppError(409, 'CONFLICT', 'Already exists');
    });
    app.get('/test/crash', () => {
      throw new Error('database password is hunter2');
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('responds to the health check', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('returns 404 in the error shape for unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/nope' });
    expect(res.statusCode).toBe(404);
    expect(ApiErrorSchema.parse(res.json()).error.code).toBe('NOT_FOUND');
  });

  it('returns 400 VALIDATION_ERROR when the body fails its zod schema', async () => {
    const res = await app.inject({ method: 'POST', url: '/test/validated', payload: { name: '' } });
    expect(res.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts a valid body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/test/validated',
      payload: { name: 'NSBE' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ hello: 'NSBE' });
  });

  it('keeps the status of Fastify client errors such as malformed JSON', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/test/validated',
      headers: { 'content-type': 'application/json' },
      payload: '{not json',
    });
    expect(res.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(res.json()).error.code).toBe('FST_ERR_CTP_INVALID_JSON_BODY');
  });

  it('maps AppError to its status and code', async () => {
    const res = await app.inject({ method: 'GET', url: '/test/app-error' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: { code: 'CONFLICT', message: 'Already exists' } });
  });

  it('hides the details of unexpected errors', async () => {
    const res = await app.inject({ method: 'GET', url: '/test/crash' });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });
});
