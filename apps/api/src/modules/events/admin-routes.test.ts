import { EventSchema, EventsResponseSchema } from '@nsbe/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app';
import { type Event, Prisma, type User } from '../../generated/prisma/client';
import { TEST_CONFIG } from '../../test-config';
import { ACCESS_TOKEN_COOKIE } from '../auth/cookies';

const event: Event = {
  id: 1,
  title: 'Meeting',
  description: 'Chapter meeting',
  startsAt: new Date('2026-11-01T18:00:00Z'),
  endsAt: new Date('2026-11-01T19:00:00Z'),
  location: 'Campus',
  rsvpLink: null,
};
const user: User = {
  id: 1,
  email: 'officer@example.com',
  name: 'Officer',
  passwordHash: 'not-returned',
  role: 'USER',
  isActive: true,
  mustChangePassword: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const payload = {
  title: ' Meeting ',
  description: 'Chapter meeting',
  startsAt: event.startsAt.toISOString(),
  location: 'Campus',
};
const missingRecord = () =>
  new Prisma.PrismaClientKnownRequestError('No record', { code: 'P2025', clientVersion: '7.10.0' });

describe('admin event routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let cookies: Record<string, string>;
  let findUser: ReturnType<typeof mockUserLookup>;

  function mockUserLookup(app: Awaited<ReturnType<typeof buildApp>>) {
    return vi.spyOn(app.prisma.user, 'findUnique').mockResolvedValue(user);
  }

  beforeEach(async () => {
    app = await buildApp(TEST_CONFIG);
    await app.ready();
    cookies = {
      [ACCESS_TOKEN_COOKIE]: app.jwt.sign({ sub: '1', role: 'USER' }, { expiresIn: '15m' }),
    };
    findUser = mockUserLookup(app);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  it.each([
    ['GET', '/api/admin/events'],
    ['GET', '/api/admin/events/1'],
    ['POST', '/api/admin/events'],
    ['PATCH', '/api/admin/events/1'],
    ['DELETE', '/api/admin/events/1'],
  ] as const)('protects %s %s before touching event data', async (method, url) => {
    const findMany = vi.spyOn(app.prisma.event, 'findMany').mockResolvedValue([]);
    const findUnique = vi.spyOn(app.prisma.event, 'findUnique').mockResolvedValue(event);
    const create = vi.spyOn(app.prisma.event, 'create').mockResolvedValue(event);
    const update = vi.spyOn(app.prisma.event, 'update').mockResolvedValue(event);
    const remove = vi.spyOn(app.prisma.event, 'delete').mockResolvedValue(event);
    const res = await app.inject({
      method,
      url,
      ...(method === 'POST' || method === 'PATCH' ? { payload } : {}),
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
    for (const query of [findMany, findUnique, create, update, remove])
      expect(query).not.toHaveBeenCalled();
    expect(findUser).not.toHaveBeenCalled();
  });

  it.each(['invalid', 'expired', 'missing-sub', 'invalid-sub', 'oversized-sub', 'bearer-only'])(
    'rejects %s tokens',
    async (kind) => {
      let token = 'invalid';
      if (kind === 'expired') token = app.jwt.sign({ sub: '1' }, { expiresIn: -1 });
      if (kind === 'missing-sub') token = app.jwt.sign({ role: 'USER' });
      if (kind === 'invalid-sub') token = app.jwt.sign({ sub: 'abc' });
      if (kind === 'oversized-sub') token = app.jwt.sign({ sub: '2147483648' });
      if (kind === 'bearer-only') token = cookies[ACCESS_TOKEN_COOKIE] ?? '';
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/events',
        ...(kind === 'bearer-only'
          ? { headers: { authorization: `Bearer ${token}` } }
          : { cookies: { [ACCESS_TOKEN_COOKIE]: token } }),
      });
      expect(res.statusCode).toBe(401);
      expect(findUser).not.toHaveBeenCalled();
    },
  );

  it.each([
    [null, 401, 'UNAUTHORIZED'],
    [{ ...user, isActive: false }, 401, 'UNAUTHORIZED'],
    [{ ...user, mustChangePassword: true }, 403, 'PASSWORD_CHANGE_REQUIRED'],
  ] as const)(
    'rejects an unavailable or restricted account (%s)',
    async (account, status, code) => {
      findUser.mockResolvedValue(account);
      const query = vi.spyOn(app.prisma.event, 'findMany').mockResolvedValue([]);
      const res = await app.inject({ method: 'GET', url: '/api/admin/events', cookies });
      expect(res.statusCode).toBe(status);
      expect(res.json()).toMatchObject({ error: { code } });
      expect(query).not.toHaveBeenCalled();
    },
  );

  it.each(['USER', 'SUPER_ADMIN'] as const)('allows an active %s to list events', async (role) => {
    findUser.mockResolvedValue({ ...user, role });
    const findMany = vi.spyOn(app.prisma.event, 'findMany').mockResolvedValue([event]);
    const res = await app.inject({ method: 'GET', url: '/api/admin/events', cookies });
    expect(res.statusCode).toBe(200);
    expect(EventsResponseSchema.parse(res.json())).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { startsAt: 'asc' },
    });
  });

  it('gets a single event with ISO dates', async () => {
    vi.spyOn(app.prisma.event, 'findUnique').mockResolvedValue(event);
    const res = await app.inject({ method: 'GET', url: '/api/admin/events/1', cookies });
    expect(res.statusCode).toBe(200);
    expect(EventSchema.parse(res.json())).toEqual({
      ...event,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString(),
    });
  });

  it('creates an event with defaults, trimming, and a Location header', async () => {
    const create = vi
      .spyOn(app.prisma.event, 'create')
      .mockResolvedValue({ ...event, endsAt: null });
    const res = await app.inject({ method: 'POST', url: '/api/admin/events', cookies, payload });
    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toBe('/api/admin/events/1');
    expect(EventSchema.parse(res.json()).endsAt).toBeNull();
    expect(create).toHaveBeenCalledWith({
      data: {
        ...payload,
        title: 'Meeting',
        startsAt: event.startsAt,
        endsAt: null,
        rsvpLink: null,
      },
    });
  });

  it('updates only supplied fields and clears nullable values', async () => {
    vi.spyOn(app.prisma.event, 'findUnique').mockResolvedValue(event);
    const update = vi
      .spyOn(app.prisma.event, 'update')
      .mockResolvedValue({ ...event, location: 'Library', endsAt: null });
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/events/1',
      cookies,
      payload: { location: ' Library ', endsAt: null, rsvpLink: null },
    });
    expect(res.statusCode).toBe(200);
    expect(EventSchema.parse(res.json()).location).toBe('Library');
    expect(update).toHaveBeenCalledWith({
      where: { id: 1, startsAt: event.startsAt, endsAt: event.endsAt },
      data: { location: 'Library', endsAt: null, rsvpLink: null, startsAt: undefined },
    });
  });

  it.each([{ startsAt: '2026-11-01T20:00:00Z' }, { endsAt: '2026-11-01T17:00:00Z' }])(
    'validates a partial date edit against stored dates: %s',
    async (body) => {
      vi.spyOn(app.prisma.event, 'findUnique').mockResolvedValue(event);
      const update = vi.spyOn(app.prisma.event, 'update').mockResolvedValue(event);
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/events/1',
        cookies,
        payload: body,
      });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
      expect(update).not.toHaveBeenCalled();
    },
  );

  it('allows valid date edits and converts them to database Date values', async () => {
    vi.spyOn(app.prisma.event, 'findUnique').mockResolvedValue(event);
    const startsAt = new Date('2026-11-02T18:00:00Z');
    const endsAt = new Date('2026-11-02T19:00:00Z');
    const update = vi
      .spyOn(app.prisma.event, 'update')
      .mockResolvedValue({ ...event, startsAt, endsAt });
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/events/1',
      cookies,
      payload: { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
    });
    expect(res.statusCode).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: { id: 1, startsAt: event.startsAt, endsAt: event.endsAt },
      data: { startsAt, endsAt },
    });
  });

  it('returns 409 when concurrent date changes invalidate the checked snapshot', async () => {
    vi.spyOn(app.prisma.event, 'findUnique').mockResolvedValue(event);
    vi.spyOn(app.prisma.event, 'update').mockRejectedValue(missingRecord());
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/events/1',
      cookies,
      payload: { title: 'Updated' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: { code: 'CONFLICT' } });
  });

  it.each(['GET', 'PATCH', 'DELETE'] as const)(
    'returns 404 for %s of a missing event',
    async (method) => {
      vi.spyOn(app.prisma.event, 'findUnique').mockResolvedValue(null);
      vi.spyOn(app.prisma.event, 'delete').mockRejectedValue(missingRecord());
      const res = await app.inject({
        method,
        url: '/api/admin/events/1',
        cookies,
        ...(method === 'PATCH' ? { payload: { title: 'Updated' } } : {}),
      });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
    },
  );

  it('deletes an event with no response body', async () => {
    const remove = vi.spyOn(app.prisma.event, 'delete').mockResolvedValue(event);
    const res = await app.inject({ method: 'DELETE', url: '/api/admin/events/1', cookies });
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');
    expect(remove).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it.each([
    ['POST', '/api/admin/events', { ...payload, title: ' ' }],
    ['POST', '/api/admin/events', { ...payload, rsvpLink: 'javascript:alert(1)' }],
    ['POST', '/api/admin/events', { ...payload, endsAt: '2026-10-01T00:00:00Z' }],
    ['PATCH', '/api/admin/events/1', {}],
    ['PATCH', '/api/admin/events/1', { surprise: true }],
    ['PATCH', '/api/admin/events/2147483648', { title: 'Updated' }],
    ['GET', '/api/admin/events/nope', undefined],
    ['DELETE', '/api/admin/events/0', undefined],
    ['GET', '/api/admin/events?period=future', undefined],
  ] as const)('rejects invalid input: %s %s %s', async (method, url, body) => {
    const create = vi.spyOn(app.prisma.event, 'create').mockResolvedValue(event);
    const findUnique = vi.spyOn(app.prisma.event, 'findUnique').mockResolvedValue(event);
    const res = await app.inject({
      method,
      url,
      cookies,
      ...(body === undefined ? {} : { payload: body }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    expect(create).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('returns a generic error on a failed write', async () => {
    vi.spyOn(app.prisma.event, 'create').mockRejectedValue(new Error('private details'));
    const res = await app.inject({ method: 'POST', url: '/api/admin/events', cookies, payload });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });
});
