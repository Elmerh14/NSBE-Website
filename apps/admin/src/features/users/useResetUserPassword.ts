import { TemporaryPasswordResponseSchema } from '@nsbe/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api';
import { USERS_QUERY_KEY } from './query-keys';

export function useResetUserPassword(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/admin/users/${String(userId)}/reset-password`, {
        method: 'POST',
        schema: TemporaryPasswordResponseSchema,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}
