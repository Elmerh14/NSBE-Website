import type { Role } from '@nsbe/shared';
import { TemporaryPasswordResponseSchema } from '@nsbe/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api';
import { USERS_QUERY_KEY } from './query-keys';

export function useReactivateUser(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: Role) =>
      apiFetch(`/api/admin/users/${String(userId)}/reactivate`, {
        method: 'POST',
        body: { role },
        schema: TemporaryPasswordResponseSchema,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}
