import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, loadEvents, removeEvent, saveEvent, signIn } from './api';

const event = {
  id: 1,
  title: 'Meeting',
  description: 'Chapter meeting',
  startsAt: '2026-11-01T18:00:00Z',
  endsAt: null,
  location: 'Campus',
  rsvpLink: null,
};
const input = {
  title: event.title,
  description: event.description,
  startsAt: event.startsAt,
  location: event.location,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('admin event API', () => {
  it('loads events with cookies and cancellation', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json([event]));
    vi.stubGlobal('fetch', fetch);
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/');
    const signal = new AbortController().signal;
    expect(await loadEvents(signal)).toEqual([event]);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/admin/events',
      expect.objectContaining({ credentials: 'include', signal }),
    );
  });

  it.each([
    [undefined, 'POST', '/api/admin/events'],
    [1, 'PATCH', '/api/admin/events/1'],
  ] as const)('uses the correct write method for id %s', async (id, method, path) => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(event));
    vi.stubGlobal('fetch', fetch);
    vi.stubEnv('VITE_API_URL', '');
    expect(await saveEvent(id, input)).toEqual(event);
    expect(fetch).toHaveBeenCalledWith(
      path,
      expect.objectContaining({ method, credentials: 'include', body: JSON.stringify(input) }),
    );
  });

  it('handles a 204 delete without attempting JSON parsing', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    await expect(removeEvent(1)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/events/1'),
      expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
    );
  });

  it.each([
    [401, 'UNAUTHORIZED'],
    [403, 'PASSWORD_CHANGE_REQUIRED'],
    [409, 'CONFLICT'],
  ] as const)('preserves %s errors for the UI', async (status, code) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(
          Response.json({ error: { code, message: 'Please try again' } }, { status }),
        ),
    );
    await expect(loadEvents()).rejects.toMatchObject({ status, code, message: 'Please try again' });
  });

  it('handles an HTML server error without leaking its body', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response('<html>private details</html>', { status: 502 })),
    );
    await expect(loadEvents()).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects a malformed successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json([{ id: 1 }])),
    );
    await expect(loadEvents()).rejects.toThrow();
  });

  it('signs in using the cookie-based API', async () => {
    const user = {
      id: 1,
      email: 'officer@example.com',
      name: 'Officer',
      role: 'USER',
      mustChangePassword: false,
    };
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json({ user }));
    vi.stubGlobal('fetch', fetch);
    expect(await signIn({ email: user.email, password: 'test-password' })).toEqual({ user });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });
});
