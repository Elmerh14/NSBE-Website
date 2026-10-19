import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchEvents } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('public calendar API', () => {
  it.each(['upcoming', 'past'] as const)(
    'requests the %s filter and passes cancellation',
    async (period) => {
      const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json([]));
      vi.stubGlobal('fetch', fetch);
      vi.stubEnv('VITE_API_URL', 'https://api.example.com/');
      const signal = new AbortController().signal;
      expect(await fetchEvents(period, signal)).toEqual([]);
      expect(fetch).toHaveBeenCalledWith(`https://api.example.com/api/events?period=${period}`, {
        signal,
      });
    },
  );

  it('surfaces request failures and rejects invalid response data', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json([{ id: 1 }]));
    vi.stubGlobal('fetch', fetch);
    await expect(fetchEvents('upcoming')).rejects.toThrow('could not load events');
    await expect(fetchEvents('past')).rejects.toThrow();
  });
});
