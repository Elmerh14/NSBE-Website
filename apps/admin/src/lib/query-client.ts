import { hashKey, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { CURRENT_USER_QUERY_KEY } from '../features/auth/query-keys';
import { ApiRequestError } from './api';

export function createQueryClient(): QueryClient {
  // A 401 that reaches here means apiFetch already tried a refresh and it failed: the session is
  // over. Re-check the current user, which then fails too, so RequireAuth sends them to /login.
  // The current-user query itself is skipped, or its own 401 would re-check it forever.
  function onError(error: Error, queryHash?: string) {
    if (
      error instanceof ApiRequestError &&
      error.status === 401 &&
      queryHash !== hashKey(CURRENT_USER_QUERY_KEY)
    ) {
      void client.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    }
  }

  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        onError(error, query.queryHash);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        onError(error);
      },
    }),
    defaultOptions: {
      queries: {
        // Retry network blips and 5xx, but not 4xx: a 401 or 404 won't fix itself.
        retry: (failureCount, error) =>
          !(error instanceof ApiRequestError && error.status < 500) && failureCount < 2,
      },
    },
  });

  return client;
}

export const queryClient = createQueryClient();
