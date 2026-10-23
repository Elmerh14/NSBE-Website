import type { ChangePasswordRequest } from '@nsbe/shared';
import { AuthResponseSchema } from '@nsbe/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { apiFetch } from '../../lib/api';
import { CURRENT_USER_QUERY_KEY } from './query-keys';

export function useChangePassword() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: ChangePasswordRequest) =>
      apiFetch('/api/auth/change-password', {
        method: 'POST',
        body,
        schema: AuthResponseSchema,
      }),
    onSuccess: async ({ user }) => {
      // The API returns the user with mustChangePassword now false, so RequireAuth lets them in.
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      await navigate('/', { replace: true });
    },
  });
}
