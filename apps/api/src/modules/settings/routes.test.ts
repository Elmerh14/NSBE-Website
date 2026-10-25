import { ApiErrorSchema, SiteSettingsResponseSchema } from '@nsbe/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app';
import type { SiteSettings, User } from '../../generated/prisma/client';
import { TEST_CONFIG } from '../../test-config';
import { installFakeDb } from '../../test-fake-db';
import { ACCESS_TOKEN_COOKIE } from '../auth/cookies';

const OFFICER: User = {
  id: 2,
  email: 'officer@example.com',
  name: 'Officer',
  passwordHash: '$argon2id$not-used-here',
  role: 'USER',
  mustChangePassword: false,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const CLEARED = {
  contactEmail: null,
  joinUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  tiktokUrl: null,
  facebookUrl: null,
};

const FILLED = {
  contactEmail: 'nsbe@example.edu',
  joinUrl: 'https://forms.gle/abc123',
  instagramUrl: 'https://www.instagram.com/nsbe',
  linkedinUrl: 'https://www.linkedin.com/company/nsbe',
  tiktokUrl: 'https://www.tiktok.com/@nsbe',
  facebookUrl: 'https://www.facebook.com/nsbe',
};

describe('site settings routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  // The single site_settings row, or null before the first save.
  let row: SiteSettings | null;

  beforeEach(async () => {
    app = await buildApp(TEST_CONFIG);
    await app.ready();
    installFakeDb(app.prisma, [OFFICER]);
    row = null;

    vi.spyOn(app.prisma.siteSettings, 'findUnique').mockImplementation((() =>
      Promise.resolve(row)) as unknown as typeof app.prisma.siteSettings.findUnique);
    vi.spyOn(app.prisma.siteSettings, 'upsert').mockImplementation((({
      create,
      update,
    }: {
      create: SiteSettings;
      update: Partial<SiteSettings>;
    }) => {
      row = row ? { ...row, ...update } : { ...create, updatedAt: new Date() };
      return Promise.resolve(row);
    }) as unknown as typeof app.prisma.siteSettings.upsert);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  function put(payload: object, user: User | null = OFFICER) {
    return app.inject({
      method: 'PUT',
      url: '/api/admin/settings',
      payload,
      cookies: user
        ? { [ACCESS_TOKEN_COOKIE]: app.jwt.sign({ sub: String(user.id), role: user.role }) }
        : {},
    });
  }

  function errorCode(res: { json: () => unknown }) {
    return ApiErrorSchema.parse(res.json()).error.code;
  }

  describe('GET /api/settings', () => {
    it('returns every field as null before anything has been saved, without logging in', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/settings' });

      expect(res.statusCode).toBe(200);
      expect(SiteSettingsResponseSchema.parse(res.json())).toEqual({ settings: CLEARED });
    });

    it('returns the saved values', async () => {
      row = { id: 1, ...FILLED, updatedAt: new Date() };

      const res = await app.inject({ method: 'GET', url: '/api/settings' });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ settings: FILLED });
    });
  });

  describe('PUT /api/admin/settings', () => {
    it('rejects a caller who is not logged in', async () => {
      const res = await put(FILLED, null);

      expect(res.statusCode).toBe(401);
      expect(errorCode(res)).toBe('UNAUTHORIZED');
      expect(row).toBeNull();
    });

    it('lets any admin, not only a super admin, save the settings', async () => {
      const res = await put(FILLED);

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ settings: FILLED });
      expect(row).toMatchObject({ id: 1, ...FILLED });
    });

    it('stores blank fields as null, so the footer leaves them out', async () => {
      row = { id: 1, ...FILLED, updatedAt: new Date() };

      const res = await put({ ...FILLED, joinUrl: '', tiktokUrl: '   ' });

      expect(res.statusCode).toBe(200);
      expect(row).toMatchObject({
        joinUrl: null,
        tiktokUrl: null,
        contactEmail: FILLED.contactEmail,
      });
    });

    it('rejects a social link to the wrong site', async () => {
      const res = await put({ ...FILLED, instagramUrl: 'https://example.com/nsbe' });

      expect(res.statusCode).toBe(400);
      expect(errorCode(res)).toBe('VALIDATION_ERROR');
      expect(row).toBeNull();
    });

    it('rejects a link that is not https', async () => {
      const res = await put({ ...FILLED, joinUrl: 'javascript:alert(1)' });

      expect(res.statusCode).toBe(400);
      expect(row).toBeNull();
    });

    it('rejects a body that leaves out a field', async () => {
      const missingOne: Partial<typeof FILLED> = { ...FILLED };
      delete missingOne.facebookUrl;

      const res = await put(missingOne);

      expect(res.statusCode).toBe(400);
      expect(row).toBeNull();
    });
  });
});
