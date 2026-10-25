import type { Role } from '@nsbe/shared';
import { UserResponseSchema } from '@nsbe/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api';
import { USERS_QUERY_KEY } from './query-keys';

export function useChangeUserRole(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: Role) =>
      apiFetch(`/api/admin/users/${String(userId)}`, {
        method: 'PATCH',
        body: { role },
        schema: UserResponseSchema,
      }),
    // Also on error: a 404 or 409 usually means the list on screen is out of date.
    onSettled: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}
