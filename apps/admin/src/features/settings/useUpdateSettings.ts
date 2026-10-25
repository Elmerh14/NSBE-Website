import type { UpdateSiteSettingsRequest } from '@nsbe/shared';
import { SiteSettingsResponseSchema } from '@nsbe/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api';
import { SETTINGS_QUERY_KEY } from './query-keys';

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateSiteSettingsRequest) =>
      apiFetch('/api/admin/settings', {
        method: 'PUT',
        body,
        schema: SiteSettingsResponseSchema,
      }),
    // The response is the saved row, so the cache can be updated without refetching.
    onSuccess: ({ settings }) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, settings);
    },
  });
}
