import type { LoginRequest } from '@nsbe/shared';
import { AuthResponseSchema } from '@nsbe/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { apiFetch } from '../../lib/api';
import { CURRENT_USER_QUERY_KEY } from './queryKeys';

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const addMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => {
      return apiFetch('/api/auth/login', {
        method: 'POST',
        body: credentials,
        schema: AuthResponseSchema,
      });
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data.user);
      if (data.user.mustChangePassword) {
        await navigate('/change-password', { replace: true });
      } else {
        await navigate('/', { replace: true });
      }
    },
  });
  return addMutation;
}
