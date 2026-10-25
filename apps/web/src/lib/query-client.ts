import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Public content changes rarely; don't refetch on every window focus.
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
