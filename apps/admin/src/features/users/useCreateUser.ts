import type { CreateUserRequest } from '@nsbe/shared';
import { TemporaryPasswordResponseSchema } from '@nsbe/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api';
import { USERS_QUERY_KEY } from './query-keys';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateUserRequest) =>
      apiFetch('/api/admin/users', {
        method: 'POST',
        body,
        schema: TemporaryPasswordResponseSchema,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}
