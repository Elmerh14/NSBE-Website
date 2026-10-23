import { AuthResponseSchema } from '@nsbe/shared';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api';
import { CURRENT_USER_QUERY_KEY } from './query-keys';

export function useCurrentUser() {
  const query = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const data = await apiFetch('/api/auth/me', {
        method: 'GET',
        schema: AuthResponseSchema,
      });
      return data.user;
    },
  });
  return query;
}
