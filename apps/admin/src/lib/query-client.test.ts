import { MutationObserver, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { CURRENT_USER_QUERY_KEY } from '../features/auth/query-keys';
import { ApiRequestError } from './api';
import { createQueryClient } from './query-client';

const USER = {
  id: 1,
  email: 'elmer@example.com',
  name: 'Elmer',
  role: 'SUPER_ADMIN',
  mustChangePassword: false,
} as const;

function unauthorized() {
  return new ApiRequestError(401, 'UNAUTHORIZED', 'You must be logged in.');
}

describe('queryClient session handling', () => {
  it('re-checks the current user after a 401 from another query, so RequireAuth sees the error', async () => {
    const client = createQueryClient();
    const fetchMe = vi.fn().mockResolvedValueOnce(USER).mockRejectedValue(unauthorized());

    // An active observer, like RequireAuth's useCurrentUser, so invalidating refetches it.
    const observer = new QueryObserver(client, {
      queryKey: CURRENT_USER_QUERY_KEY,
      queryFn: fetchMe,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await vi.waitFor(() => {
      expect(observer.getCurrentResult().data).toEqual(USER);
    });

    // Another page's request fails with 401 after the refresh also failed: the session is over.
    await client
      .query({ queryKey: ['events'], queryFn: () => Promise.reject(unauthorized()) })
      .catch(() => undefined);

    await vi.waitFor(() => {
      expect(observer.getCurrentResult().isError).toBe(true);
    });
    expect(fetchMe).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('re-checks the current user after a 401 from a mutation', async () => {
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    await new MutationObserver(client, { mutationFn: () => Promise.reject(unauthorized()) })
      .mutate()
      .catch(() => undefined);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: CURRENT_USER_QUERY_KEY });
  });

  it("doesn't re-check after the current-user query's own 401, which would loop forever", async () => {
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    await client
      .query({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: () => Promise.reject(unauthorized()),
      })
      .catch(() => undefined);

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("doesn't re-check after errors that aren't 401", async () => {
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const forbidden = new ApiRequestError(403, 'FORBIDDEN', 'Not allowed');

    await client
      .query({ queryKey: ['users'], queryFn: () => Promise.reject(forbidden) })
      .catch(() => undefined);

    expect(invalidate).not.toHaveBeenCalled();
  });
});
