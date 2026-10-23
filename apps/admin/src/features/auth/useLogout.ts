import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { apiFetch } from '../../lib/api';

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    // Revokes the refresh token and clears both cookies. If it fails, the user stays logged in
    // and sees an error, rather than looking logged out while the session still works.
    mutationFn: () => apiFetch('/api/auth/logout', { method: 'POST' }),
    onSuccess: async () => {
      await navigate('/login', { replace: true });
      // Drop everything cached for this user, so the next person to log in starts clean.
      queryClient.clear();
    },
  });
}
