import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api';
import { USERS_QUERY_KEY } from './query-keys';

export function useDeactivateUser(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch(`/api/admin/users/${String(userId)}`, { method: 'DELETE' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}
