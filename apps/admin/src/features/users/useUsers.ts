import { UsersResponseSchema } from '@nsbe/shared';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api';
import { USERS_QUERY_KEY } from './query-keys';

// `enabled` is false for non-super-admins, who would only get a 403.
export function useUsers(enabled: boolean) {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const data = await apiFetch('/api/admin/users', { schema: UsersResponseSchema });
      return data.users;
    },
    enabled,
  });
}
