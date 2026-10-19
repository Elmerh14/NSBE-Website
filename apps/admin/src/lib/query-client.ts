import { QueryClient } from '@tanstack/react-query';

import { ApiRequestError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry network blips and 5xx, but not 4xx: a 401 or 404 won't fix itself.
      retry: (failureCount, error) =>
        !(error instanceof ApiRequestError && error.status < 500) && failureCount < 2,
    },
  },
});
