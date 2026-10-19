import { ApiErrorSchema, EventsResponseSchema } from '@nsbe/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app';
import type { Event } from '../../generated/prisma/client';
import { TEST_CONFIG } from '../../test-config';

const NOW = new Date('2026-11-01T18:00:00Z');
const event: Event = {
  id: 1,
  title: 'Chapter meeting',
  description: 'Meet the chapter.',
  startsAt: NOW,
  endsAt: null,
  location: 'Campus',
  rsvpLink: null,
};

describe('GET /api/events', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    // Freeze Date only; Fastify still needs real timers for request injection.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    app = await buildApp(TEST_CONFIG);
    await app.ready();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    await app.close();
  });

  it.each([
    ['?period=upcoming', { startsAt: { gte: NOW } }, 'asc'],
    ['?period=past', { startsAt: { lt: NOW } }, 'desc'],
    ['', {}, 'asc'],
  ])('queries the correct range and order for %s', async (query, where, order) => {
    const findMany = vi.spyOn(app.prisma.event, 'findMany').mockResolvedValue([event]);

    const res = await app.inject({ method: 'GET', url: `/api/events${query}` });

    expect(res.statusCode).toBe(200);
    expect(findMany).toHaveBeenCalledExactlyOnceWith({ where, orderBy: { startsAt: order } });
    expect(EventsResponseSchema.parse(res.json())).toEqual([
      { ...event, startsAt: NOW.toISOString(), endsAt: null },
    ]);
  });

  it('serializes a non-null end date and RSVP link', async () => {
    const endsAt = new Date('2026-11-01T19:00:00Z');
    const row = { ...event, endsAt, rsvpLink: 'https://example.com/rsvp' };
    vi.spyOn(app.prisma.event, 'findMany').mockResolvedValue([row]);

    const res = await app.inject({ method: 'GET', url: '/api/events' });

    expect(res.statusCode).toBe(200);
    expect(EventsResponseSchema.parse(res.json())).toEqual([
      { ...row, startsAt: NOW.toISOString(), endsAt: endsAt.toISOString() },
    ]);
  });

  it('returns an empty array when there are no matching events', async () => {
    vi.spyOn(app.prisma.event, 'findMany').mockResolvedValue([]);
    const res = await app.inject({ method: 'GET', url: '/api/events?period=upcoming' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('rejects an invalid period before querying the database', async () => {
    const findMany = vi.spyOn(app.prisma.event, 'findMany').mockResolvedValue([]);
    const res = await app.inject({ method: 'GET', url: '/api/events?period=future' });
    expect(res.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(res.json()).error.code).toBe('VALIDATION_ERROR');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('hides database errors behind the standard error response', async () => {
    vi.spyOn(app.prisma.event, 'findMany').mockRejectedValue(new Error('private database details'));
    const res = await app.inject({ method: 'GET', url: '/api/events' });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });
});
